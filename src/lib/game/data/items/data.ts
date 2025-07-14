/**
 * @fileOverview Defines the 'Data' category items in the game.
 * @description These items are typically used as quest objectives, keys, or informational objects
 * that drive the narrative forward rather than being consumed or equipped.
 */

import type { ItemDefinition } from "../../definitions/item";

export const dataItems: Record<string, ItemDefinition> = {
    'Tai Yêu Tinh': {
        name: { en: 'Goblin Ear', vi: 'Tai Yêu Tinh' },
        description: { en: 'item_tai_yeu_tinh_desc', vi: 'item_tai_yeu_tinh_desc' },
        tier: 2,
        category: 'Data',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chìa Khóa Rỉ Sét': {
        name: { en: 'Rusty Key', vi: 'Chìa Khóa Rỉ Sét' },
        description: { en: 'item_chia_khoa_ri_set_desc', vi: 'item_chia_khoa_ri_set_desc' },
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        name: { en: 'Ancient Pottery Shard', vi: 'Mảnh Gốm Cổ' },
        description: { en: 'item_manh_gom_co_desc', vi: 'item_manh_gom_co_desc' },
        tier: 2,
        category: 'Data',
        emoji: '🏺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Griffon': {
        name: { en: 'Griffon Egg', vi: 'Trứng Griffon' },
        description: { en: 'item_trung_griffon_desc', vi: 'item_trung_griffon_desc' },
        tier: 6,
        category: 'Data',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bản Đồ Cổ': {
        name: { en: 'Ancient Map', vi: 'Bản Đồ Cổ' },
        description: { en: 'item_ban_do_co_desc', vi: 'item_ban_do_co_desc' },
        tier: 3,
        category: 'Data',
        emoji: '🗺️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hồ Sơ Vụ Án': {
        name: { en: 'Case File', vi: 'Hồ Sơ Vụ Án' },
        description: { en: 'item_case_file_desc', vi: 'item_case_file_desc' },
        emoji: '📂',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Nhật ký Kỹ sư': {
        name: { en: "Engineer's Log", vi: 'Nhật ký Kỹ sư' },
        description: { en: 'item_engineer_log_desc', vi: 'item_engineer_log_desc' },
        emoji: '📋',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Trang Nhật ký Bị xé': {
        name: { en: 'Torn Diary Page', vi: 'Trang Nhật ký Bị xé' },
        description: { en: 'item_torn_diary_page_desc', vi: 'item_torn_diary_page_desc' },
        emoji: '📄',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Chip Tiền thưởng': {
        name: { en: 'Bounty Puck', vi: 'Chip Tiền thưởng' },
        description: { en: 'item_bounty_puck_desc', vi: 'item_bounty_puck_desc' },
        emoji: '💿',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Mảnh Bia đá Cổ': {
        name: { en: 'Ancient Tablet Fragment', vi: 'Mảnh Bia đá Cổ' },
        description: { en: 'item_ancient_tablet_fragment_desc', vi: 'item_ancient_tablet_fragment_desc' },
        emoji: '📜',
        category: 'Data',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Nhật Ký Của Người Sống Sót': {
        name: { en: "Survivor's Diary", vi: 'Nhật Ký Của Người Sống Sót' },
        description: { en: 'item_survivor_diary_desc', vi: 'item_survivor_diary_desc' },
        emoji: '📔',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Sách Phép Cơ Bản': {
        name: { en: 'Tome of Cantrips', vi: 'Sách Phép Cơ Bản' },
        description: { en: 'item_tome_of_cantrips_desc', vi: 'item_tome_of_cantrips_desc' },
        emoji: '📕',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Chủ đề Stan Twitter': {
        name: { en: 'Stan Twitter Thread', vi: 'Chủ đề Stan Twitter' },
        description: { en: 'item_stan_twitter_thread_desc', vi: 'item_stan_twitter_thread_desc' },
        emoji: '📜',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
    'Phiếu giảm giá Onika Burger': {
        name: { en: 'Onika Burger Coupon', vi: 'Phiếu giảm giá Onika Burger' },
        description: { en: 'item_onika_burger_coupon_desc', vi: 'item_onika_burger_coupon_desc' },
        emoji: '🎟️',
        category: 'Data',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
    },
};
