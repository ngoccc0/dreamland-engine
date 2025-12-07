import { z } from 'zod';
import { LootDropSchema, TranslatableStringSchema } from './base'; // Import TranslatableStringSchema for part names if needed, LootDropSchema for loot

// Schema for an individual plant part
export const PlantPartDefinitionSchema = z.object({
    /** Unique name for the part, e.g., 'leaves', 'flowers'. */
    name: z.string().describe("Unique name for the part, e.g., 'leaves', 'flowers'."),
    /** Maximum quantity of this part the plant can have. */
    maxQty: z.number().min(0).describe("Maximum quantity of this part the plant can have."),
    /** Current quantity of this part (runtime state, optional in definition). */
    currentQty: z.number().min(0).optional().describe("Current quantity of this part (runtime state, optional in definition)."),
    /** Base probability (0-1) for this part to grow/regenerate per tick. */
    growProb: z.number().min(0).max(1).describe("Base probability (0-1) for this part to grow/regenerate per tick."),
    /** Base probability (0-1) for this part to drop/decay per tick. */
    dropProb: z.number().min(0).max(1).describe("Base probability (0-1) for this part to drop/decay per tick."),
    /** Items obtained when this part is harvested. */
    loot: z.array(LootDropSchema).describe("Items obtained when this part is harvested."),
    /** Items dropped passively from this part (e.g., seeds from fruits, fallen leaves). */
    droppedLoot: z.array(LootDropSchema).optional().describe("Items dropped passively from this part (e.g., seeds from fruits, fallen leaves)."),
    /** Name of another part this part's growth depends on (e.g., 'flowers' depend on 'leaves'). */
    triggerFrom: z.string().optional().describe("Name of another part this part's growth depends on (e.g., 'flowers' depend on 'leaves')."),
    /** True if this is a structural part (e.g., trunk, roots) that regenerates very slowly. */
    structural: z.boolean().optional().describe("True if this is a structural part (e.g., trunk, roots) that regenerates very slowly."),
    /** True if this part is usually hidden and requires a specific action (e.g., 'dig') to access. */
    hidden: z.boolean().optional().describe("True if this part is usually hidden and requires a specific action (e.g., 'dig') to access."),
});

export type PlantPartDefinition = z.infer<typeof PlantPartDefinitionSchema>;

/**
 * Định nghĩa các thuộc tính đặc biệt của thực vật ảnh hưởng đến vegetation density
 */
export const PlantPropertiesSchema = z.object({
    /**
     * Mức độ đóng góp vào vegetation density của chunk (0-100)
     * Ví dụ: cây to = 20, cỏ = 2
     */
    vegetationContribution: z.number().min(0).max(100),

    /**
     * Tỷ lệ đóng góp ban đầu của thực vật vào mật độ thực vật tổng thể (0-1).
     * Được thiết lập khi cây được tạo ra và sử dụng làm tham chiếu cho các thay đổi.
     */
    initialVegetationRatio: z.number().min(0).max(1).optional().describe("Initial contribution ratio to overall vegetation density (0-1), set on creation."),

    /**
     * Danh sách các bộ phận của cây, mỗi bộ phận có chu kỳ sống và loot riêng.
     */
    parts: z.array(PlantPartDefinitionSchema).optional().describe("List of plant parts, each with its own lifecycle and loot."),

    /**
     * Khả năng sinh sản tự nhiên
     */
    reproduction: z.object({
        // Xác suất sinh sản mỗi tick (0-1)
        chance: z.number().min(0).max(1),
        // Khoảng cách lan rộng tối đa (số chunk)
        range: z.number().min(1),
        // Số lượng con tối đa trong 1 lần sinh sản
        maxOffspring: z.number().min(1),
        // Điều kiện môi trường cần thiết để sinh sản
        requirements: z.object({
            minMoisture: z.number().min(0).max(100),
            minTemperature: z.number(),
            maxTemperature: z.number(),
            minVegetationDensity: z.number().min(0).max(100)
        })
    }).optional(),

    /**
     * Khả năng chống chịu với môi trường
     */
    resilience: z.object({
        droughtResistance: z.number().min(0).max(1),
        coldResistance: z.number().min(0).max(1),
        heatResistance: z.number().min(0).max(1)
    }).optional()
});

export type PlantProperties = z.infer<typeof PlantPropertiesSchema>;
