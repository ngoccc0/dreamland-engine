/**
 * @fileOverview Defines the 'Data' category items in the game.
 * @description These items are typically used as quest objectives, keys, or informational objects
 * that drive the narrative forward rather than being consumed or equipped.
 */

import type { ItemDefinition } from "../../definitions/item";

export const dataItems: Record<string, ItemDefinition> = {
    'Tai Yêu Tinh': {
        description: 'item_tai_yeu_tinh_desc',
        tier: 2,
        category: 'Data',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chìa Khóa Rỉ Sét': {
        description: 'item_chia_khoa_ri_set_desc',
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        description: 'item_manh_gom_co_desc',
        tier: 2,
        category: 'Data',
        emoji: '🏺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Griffon': {
        description: 'item_trung_griffon_desc',
        tier: 6,
        category: 'Data',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bản Đồ Cổ': {
        description: 'item_ban_do_co_desc',
        tier: 3,
        category: 'Data',
        emoji: '🗺️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hồ Sơ Vụ Án': {
        description: 'item_case_file_desc',
        emoji: '📂',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Nhật ký Kỹ sư': {
        description: 'item_engineer_log_desc',
        emoji: '📋',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Trang Nhật ký Bị xé': {
        description: 'item_torn_diary_page_desc',
        emoji: '📄',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Chip Tiền thưởng': {
        description: 'item_bounty_puck_desc',
        emoji: '💿',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Mảnh Bia đá Cổ': {
        description: 'item_ancient_tablet_fragment_desc',
        emoji: '📜',
        category: 'Data',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Nhật Ký Của Người Sống Sót': {
        description: 'item_survivor_diary_desc',
        emoji: '📔',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Sách Phép Cơ Bản': {
        description: 'item_tome_of_cantrips_desc',
        emoji: '📕',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Chủ đề Stan Twitter': {
        description: 'item_stan_twitter_thread_desc',
        emoji: '📜',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Phiếu giảm giá Onika Burger': {
        description: 'item_onika_burger_coupon_desc',
        emoji: '🎟️',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
};
