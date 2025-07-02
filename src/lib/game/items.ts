import type { ItemDefinition } from "./types";
import { newBuildItems } from './structures';


// --- CENTRAL ITEM CATALOG ---
// The description field now holds a key for the i18n system.
export const itemDefinitions: Record<string, ItemDefinition> = {
    ...newBuildItems,
    // --- VẬT PHẨM CHẾ TẠO CƠ BẢN ---
    'Sỏi': {
        description: 'item_soi_desc',
        tier: 1,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Đá Cuội': {
        description: 'item_da_cuoi_desc',
        tier: 1,
        category: 'Material',
        emoji: '🗿',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Đất Sét': {
        description: 'item_dat_set_desc',
        tier: 1,
        category: 'Material',
        emoji: '🧱',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cát Thường': {
        description: 'item_cat_thuong_desc',
        tier: 1,
        category: 'Material',
        emoji: '⏳',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Mảnh Xương': {
        description: 'item_manh_xuong_desc',
        tier: 1,
        category: 'Material',
        emoji: '🦴',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Dây Gai': {
        description: 'item_day_gai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Thú Nhỏ': {
        description: 'item_da_thu_nho_desc',
        tier: 1,
        category: 'Material',
        emoji: '🩹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Vải Rách': {
        description: 'item_manh_vai_rach_desc',
        tier: 1,
        category: 'Material',
        emoji: ' rags ',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Gỗ': {
        description: 'item_loi_go_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Mài': {
        description: 'item_da_mai_desc',
        tier: 2,
        category: 'Tool',
        emoji: '🔪',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bột Xương': {
        description: 'item_bot_xuong_desc',
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chìa Khóa Rỉ Sét': {
        description: 'item_chia_khoa_ri_set_desc',
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM CHẾ TẠO ĐƯỢC ---
    'Rìu Đá Đơn Giản': {
        description: 'item_riu_da_don_gian_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc Máu Yếu': {
        description: 'item_thuoc_mau_yeu_desc',
        tier: 1,
        category: 'Support',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bó Đuốc': {
        description: 'item_bo_duoc_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM TỪ SINH VẬT ---
    'Nanh Sói': {
        description: 'item_nanh_soi_desc',
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Sói Sống': {
        description: 'item_thit_soi_song_desc',
        tier: 1,
        category: 'Food',
        emoji: '🥩',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tơ Nhện Khổng Lồ': {
        description: 'item_to_nhen_khong_lo_desc',
        tier: 2,
        category: 'Material',
        emoji: '🕸️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Mắt Nhện': {
        description: 'item_mat_nhen_desc',
        tier: 2,
        category: 'Material',
        emoji: '👁️',
        effects: [],
        baseQuantity: { min: 2, max: 8 }
    },
    'Da Heo Rừng': {
        description: 'item_da_heo_rung_desc',
        tier: 2,
        category: 'Material',
        emoji: '🐗',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        description: 'item_thit_heo_rung_desc',
        tier: 2,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tai Yêu Tinh': {
        description: 'item_tai_yeu_tinh_desc',
        tier: 2,
        category: 'Data',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Móng Vuốt Gấu': {
        description: 'item_mong_vuot_gau_desc',
        tier: 4,
        category: 'Material',
        emoji: '🐾',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Da Gấu': {
        description: 'item_da_gau_desc',
        tier: 4,
        category: 'Material',
        emoji: '🐻',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Thỏ': {
        description: 'item_thit_tho_desc',
        tier: 1,
        category: 'Food',
        emoji: '🐰',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Da Cáo': {
        description: 'item_da_cao_desc',
        tier: 2,
        category: 'Material',
        emoji: '🦊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Châu Chấu': {
        description: 'item_canh_chau_chau_desc',
        tier: 1,
        category: 'Material',
        emoji: '🦗',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Răng Linh Cẩu': {
        description: 'item_rang_linh_cau_desc',
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Rắn': {
        description: 'item_da_ran_desc',
        tier: 2,
        category: 'Material',
        emoji: '🐍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Rắn': {
        description: 'item_trung_ran_desc',
        tier: 2,
        category: 'Food',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Đuôi Bọ Cạp': {
        description: 'item_duoi_bo_cap_desc',
        tier: 3,
        category: 'Material',
        emoji: '🦂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Kền Kền': {
        description: 'item_long_ken_ken_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cát Ma Thuật': {
        description: 'item_cat_ma_thuat_desc',
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chất nhờn của Đỉa': {
        description: 'item_chat_nhon_cua_dia_desc',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        description: 'item_tinh_chat_ma_troi_desc',
        tier: 4,
        category: 'Magic',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Da Cá Sấu': {
        description: 'item_da_ca_sau_desc',
        tier: 4,
        category: 'Material',
        emoji: '🐊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Răng Cá Sấu': {
        description: 'item_rang_ca_sau_desc',
        tier: 3,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Cánh Muỗi': {
        description: 'item_canh_muoi_desc',
        tier: 1,
        category: 'Material',
        emoji: '🦟',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Sừng Dê Núi': {
        description: 'item_sung_de_nui_desc',
        tier: 3,
        category: 'Material',
        emoji: '🐐',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Dê Núi': {
        description: 'item_thit_de_nui_desc',
        tier: 2,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Người Đá': {
        description: 'item_loi_nguoi_da_desc',
        tier: 5,
        category: 'Energy Source',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Harpie': {
        description: 'item_long_harpie_desc',
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 3, max: 6 }
    },
    'Da Báo Tuyết': {
        description: 'item_da_bao_tuyet_desc',
        tier: 4,
        category: 'Material',
        emoji: '🐆',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Báo Tuyết': {
        description: 'item_thit_bao_tuyet_desc',
        tier: 3,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cánh Dơi': {
        description: 'item_canh_doi_desc',
        tier: 2,
        category: 'Material',
        emoji: '🦇',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Độc Nhện Hang': {
        description: 'item_noc_doc_nhen_hang_desc',
        tier: 3,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chất nhờn Slime': {
        description: 'item_chat_nhon_slime_desc',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Răng Sâu Bò': {
        description: 'item_rang_sau_bo_desc',
        tier: 5,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - RỪNG ---
    'Quả Mọng Ăn Được': {
        description: 'item_qua_mong_an_duoc_desc',
        tier: 1,
        category: 'Food',
        emoji: '🍓',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 2, max: 6 },
        growthConditions: {
            optimal: { moisture: { min: 5 }, vegetationDensity: { min: 7 } },
            subOptimal: { moisture: { min: 3, max: 4 } }
        }
    },
    'Nấm Độc': {
        description: 'item_nam_doc_desc',
        tier: 2,
        category: 'Material',
        emoji: '🍄',
        effects: [], // No positive effects
        baseQuantity: { min: 1, max: 3 },
        growthConditions: {
            optimal: { moisture: { min: 7, max: 10 }, lightLevel: { max: -2 } },
            subOptimal: { moisture: { min: 5, max: 6 }, lightLevel: { min: -1, max: 1 } }
        }
    },
    'Thảo Dược Chữa Lành': {
        description: 'item_thao_duoc_chua_lanh_desc',
        tier: 2,
        category: 'Support',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 },
        growthConditions: {
            optimal: { moisture: { min: 6, max: 8 }, temperature: { min: 5, max: 8 }, lightLevel: { min: 2, max: 6 } },
            subOptimal: { moisture: { min: 4, max: 5 }, temperature: { min: 3, max: 4 } }
        }
    },
    'Cành Cây Chắc Chắn': {
        description: 'item_canh_cay_chac_chan_desc',
        tier: 1,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mũi Tên Cũ': {
        description: 'item_mui_ten_cu_desc',
        tier: 1,
        category: 'Material',
        emoji: '🏹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        description: 'item_hoa_tinh_linh_desc',
        tier: 4,
        category: 'Magic',
        emoji: '🌸',
        effects: [], // Would be 'RESTORE_MANA' if mana existed
        baseQuantity: { min: 1, max: 1 },
        growthConditions: {
            optimal: { magicAffinity: { min: 7 } },
            subOptimal: { magicAffinity: { min: 5, max: 6 } }
        }
    },
     'Rễ Cây Hiếm': {
        description: 'item_re_cay_hiem_desc',
        tier: 3,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Vỏ Cây Cổ Thụ': {
        description: 'item_vo_cay_co_thu_desc',
        tier: 3,
        category: 'Material',
        emoji: '🌳',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nhựa Cây Dính': {
        description: 'item_nhua_cay_dinh_desc',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mật Ong Hoang': {
        description: 'item_mat_ong_hoang_desc',
        tier: 2,
        category: 'Food',
        emoji: '🍯',
        effects: [{ type: 'HEAL', amount: 10 }, { type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rêu Xanh': {
        description: 'item_reu_xanh_desc',
        tier: 1,
        category: 'Material',
        emoji: ' moss ',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cỏ Ba Lá': {
        description: 'item_co_ba_la_desc',
        tier: 2,
        category: 'Material',
        emoji: '🍀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tổ Chim Rỗng': {
        description: 'item_to_chim_rong_desc',
        tier: 1,
        category: 'Material',
        emoji: ' nests ',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },


    // --- TÀI NGUYÊN BIOME - ĐỒNG CỎ ---
    'Hoa Dại': {
        description: 'item_hoa_dai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌻',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Lúa Mì': {
        description: 'item_lua_mi_desc',
        tier: 1,
        category: 'Food',
        emoji: '🌾',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Lông Chim Ưng': {
        description: 'item_long_chim_ung_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Lửa': {
        description: 'item_da_lua_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Chim Hoang': {
        description: 'item_trung_chim_hoang_desc',
        tier: 1,
        category: 'Food',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Rễ Củ Ăn Được': {
        description: 'item_re_cu_an_duoc_desc',
        tier: 1,
        category: 'Food',
        emoji: '🥔',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Hạt Giống Hoa Dại': {
        description: 'item_hat_giong_hoa_dai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Nấm Mỡ': {
        description: 'item_nam_mo_desc',
        tier: 1,
        category: 'Food',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cỏ Khô': {
        description: 'item_co_kho_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },

    // --- TÀI NGUYÊN BIOME - SA MẠC ---
    'Bình Nước Cũ': {
        description: 'item_binh_nuoc_cu_desc',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
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
    'Hoa Xương Rồng': {
        description: 'item_hoa_xuong_rong_desc',
        tier: 1,
        category: 'Food',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Xương Động Vật': {
        description: 'item_xuong_dong_vat_desc',
        tier: 1,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Sa Thạch': {
        description: 'item_da_sa_thach_desc',
        tier: 1,
        category: 'Material',
        emoji: '🏜️',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Bọ Cạp': {
        description: 'item_noc_bo_cap_desc',
        tier: 4,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cây Xương Rồng Nhỏ': {
        description: 'item_cay_xuong_rong_nho_desc',
        tier: 1,
        category: 'Food',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 },
        growthConditions: {
            optimal: { temperature: { min: 8 }, moisture: { max: 1 } },
            subOptimal: { temperature: { min: 6, max: 7 }, moisture: { min: 2, max: 3 } }
        }
    },
    'Thủy tinh sa mạc': {
        description: 'item_thuy_tinh_sa_mac_desc',
        tier: 3,
        category: 'Material',
        emoji: '🔍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - ĐẦM LẦY ---
    'Rêu Phát Sáng': {
        description: 'item_reu_phat_sang_desc',
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
        growthConditions: {
            optimal: { moisture: { min: 8 }, lightLevel: { max: -5 } },
            subOptimal: { moisture: { min: 6, max: 7 }, lightLevel: { min: -4, max: -2 } }
        }
    },
    'Trứng Bò Sát': {
        description: 'item_trung_bo_sat_desc',
        tier: 2,
        category: 'Material',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Nấm Đầm Lầy': {
        description: 'item_nam_dam_lay_desc',
        tier: 1,
        category: 'Food',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Cây Sậy': {
        description: 'item_cay_say_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 3, max: 7 }
    },
    'Hoa Độc': {
        description: 'item_hoa_doc_desc',
        tier: 2,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nước Bùn': {
        description: 'item_nuoc_bun_desc',
        tier: 1,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - NÚI ---
    'Quặng Sắt': {
        description: 'item_quang_sat_desc',
        tier: 2,
        category: 'Material',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lông Đại Bàng': {
        description: 'item_long_dai_bang_desc',
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        description: 'item_pha_le_nui_desc',
        tier: 4,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Thuốc Núi': {
        description: 'item_cay_thuoc_nui_desc',
        tier: 3,
        category: 'Support',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Griffon': {
        description: 'item_trung_griffon_desc',
        tier: 6,
        category: 'Data',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vỏ Chai': {
        description: 'item_da_vo_chai_desc',
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Granit': {
        description: 'item_da_granit_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Địa Y': {
        description: 'item_cay_dia_y_desc',
        tier: 2,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        description: 'item_trung_dai_bang_desc',
        tier: 3,
        category: 'Food',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tuyết': {
        description: 'item_tuyet_desc',
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 }
    },

    // --- TÀI NGUYÊN BIOME - HANG ĐỘNG ---
     'Mảnh Tinh Thể': {
        description: 'item_manh_tinh_the_desc',
        tier: 2,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Bản Đồ Cổ': {
        description: 'item_ban_do_co_desc',
        tier: 3,
        category: 'Data',
        emoji: '🗺️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Xương Cổ': {
        description: 'item_xuong_co_desc',
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mỏ Vàng': {
        description: 'item_mo_vang_desc',
        tier: 5,
        category: 'Material',
        emoji: '💰',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nấm Phát Quang': {
        description: 'item_nam_phat_quang_desc',
        tier: 3,
        category: 'Material',
        emoji: '🍄',
        effects: [], // Special effect would require new logic, so no effect for now.
        baseQuantity: { min: 2, max: 5 },
        growthConditions: {
            optimal: { lightLevel: { max: -6 }, moisture: { min: 7 } },
            subOptimal: { lightLevel: { min: -5, max: -3 } }
        }
    },
    'Túi Trứng Nhện': {
        description: 'item_tui_trung_nhen_desc',
        tier: 3,
        category: 'Material',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nước Ngầm': {
        description: 'item_nuoc_ngam_desc',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vôi': {
        description: 'item_da_voi_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Guano (Phân dơi)': {
        description: 'item_guano_desc',
        tier: 1,
        category: 'Material',
        emoji: '💩',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },

    // --- TÀI NGUYÊN BIOME - RỪNG RẬM (JUNGLE) ---
    'Dây leo Titan': {
        description: 'item_day_leo_titan_desc',
        tier: 3,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Hoa ăn thịt': {
        description: 'item_hoa_an_thit_desc',
        tier: 3,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nọc Ếch độc': {
        description: 'item_noc_ech_doc_desc',
        tier: 4,
        category: 'Material',
        emoji: '🐸',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Vẹt Sặc Sỡ': {
        description: 'item_long_vet_sac_so_desc',
        tier: 2,
        category: 'Material',
        emoji: '🦜',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Quả Lạ': {
        description: 'item_qua_la_desc',
        tier: 2,
        category: 'Food',
        emoji: '🥥',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 3 }
    },

    // --- TÀI NGUYÊN BIOME - NÚI LỬA (VOLCANIC) ---
    'Đá Obsidian': {
        description: 'item_da_obsidian_desc',
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Lưu huỳnh': {
        description: 'item_luu_huynh_desc',
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Trái tim Magma': {
        description: 'item_trai_tim_magma_desc',
        tier: 5,
        category: 'Energy Source',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tro núi lửa': {
        description: 'item_tro_nui_lua_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌋',
        effects: [],
        baseQuantity: { min: 1, max: 5 }
    },
};
