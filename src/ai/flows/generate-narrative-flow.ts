/**
 * Luồng Kể Chuyện AI cho Dreamland Engine.
 *
 * File này định nghĩa luồng Genkit chịu trách nhiệm tạo ra các câu chuyện động, nhận biết ngữ cảnh
 * cho game. Nó hoạt động như một AI Game Master, lấy trạng thái game hiện tại và hành động của người chơi
 * để tạo ra một câu chuyện phong phú, luôn phát triển. Nó sử dụng các công cụ để thực hiện các phép tính
 * trạng thái game đáng tin cậy, bắt đầu nhiệm vụ mới từ NPC và xử lý việc hoàn thành nhiệm vụ.
 *
 * - `generateNarrative`: Hàm chính được gọi từ giao diện người dùng game.
 * - `GenerateNarrativeInput`: Zod schema cho dữ liệu đầu vào.
 * - `GenerateNarrativeOutput`: Zod schema cho phản hồi AI có cấu trúc.
 *
 * Animation Integration (Phase 3):
 * - Determines animationType based on mood strength and game state
 * - Injects thinkingMarker for complex state or dangerous actions
 * - Sets speedMultiplier based on narrative length and mood intensity
 * - Defers emphasizedSegments to TextEmphasisRules for keyword highlighting
 */

import { getAi } from '@/ai/genkit';
import { z } from 'zod';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema, ItemDefinitionSchema, GeneratedItemSchema, NpcSchema } from '@/ai/schemas';
import { determineAnimationMetadata } from '@/ai/animation-metadata';

import { LanguageEnum as Language } from '@/lib/core/i18n'; // Import Language enum

// Import tool getter functions and schemas from game-actions
import {
    getTakeItemTool,
    getUseItemTool,
    getTameEnemyTool,
    getUseSkillTool,
    getCompleteQuestTool,
    CompleteQuestInputSchema,
    CompleteQuestOutputSchema,
    getStartQuestTool,
    StartQuestOutputSchema
} from '@/ai/tools/game-actions';

import { generateNewQuest } from './generate-new-quest';
import { generateLegendaryQuest } from './generate-legendary-quest-flow';
import { generateNewItem } from './generate-new-item';
import { allItems as staticItemDefinitions } from '@/core/data/items';
import type { AiModel } from '@/core/types/game';

// == STEP 1: DEFINE THE INPUT SCHEMA ==

/**
 * Schema định nghĩa cấp độ thành công của một lần tung xúc xắc.
 */
const SuccessLevelSchema = z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']);

/**
 * Schema định nghĩa đầu vào cho luồng `generateNarrative`.
 * @property {z.string} worldName - Tên của thế giới game.
 * @property {z.string} playerAction - Hành động người chơi vừa thực hiện.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {ChunkSchema} currentChunk - Các thuộc tính chi tiết của ô bản đồ hiện tại của người chơi.
 * @property {z.array} [surroundingChunks] - Lưới 3x3 các chunk xung quanh người chơi để cung cấp ngữ cảnh môi trường.
 * @property {z.array} recentNarrative - Một vài mục nhập gần đây từ nhật ký kể chuyện để cung cấp ngữ cảnh trò chuyện.
 * @property {z.string} language - Ngôn ngữ cho nội dung được tạo ('en' hoặc 'vi').
 * @property {z.number} diceRoll - Kết quả của lần tung xúc xắc.
 * @property {z.string} diceType - Loại xúc xắc được sử dụng (ví dụ: 'd20', '2d6').
 * @property {z.string} diceRange - Phạm vi có thể có của lần tung xúc xắc (उदाहरण: '1-20', '2-12').
 * @property {SuccessLevelSchema} successLevel - Kết quả phân loại của lần tung xúc xắc.
 * @property {z.record} [customItemDefinitions] - Map các định nghĩa vật phẩm do AI tạo cho phiên chơi hiện tại.
 * @property {z.enum} aiModel - Ưu tiên mô hình AI để tạo nội dung.
 * @property {z.enum} narrativeLength - Độ dài mong muốn cho phản hồi kể chuyện.
 */
export const GenerateNarrativeInputSchema = z.object({
    worldName: z.string().describe("The name of the game world."),
    playerAction: z.string().describe("The action taken by the player.")
});
