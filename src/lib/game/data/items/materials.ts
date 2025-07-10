import type { ItemDefinition } from "../../types";

export const materialItems: Record<string, ItemDefinition> = {
    'Cành Cây Chắc Chắn': {
        description: 'item_canh_cay_chac_chan_desc',
        tier: 1,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        relationship: { substituteFor: 'Lõi Gỗ', tier: 2 }
    },
    'Mảnh Xương': {
        description: 'item_manh_xuong_desc',
        tier: 1,
        category: 'Material',
        emoji: '🦴',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
        relationship: { substituteFor: 'Lõi Gỗ', tier: 3 }
    },
     'Da Thú Nhỏ': {
        description: 'item_da_thu_nho_desc',
        tier: 1,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🩹',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        relationship: { substituteFor: 'Dây Gai', tier: 2 }
    },
    'Mảnh Vải Rách': {
        description: 'item_manh_vai_rach_desc',
        tier: 1,
        category: 'Material',
        emoji: ' rags ',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        relationship: { substituteFor: 'Dây Gai', tier: 3 }
    },
    'Lá cây lớn': {
        description: 'item_la_cay_lon_desc',
        tier: 1,
        category: 'Material',
        emoji: '🍃',
        effects: [],
        baseQuantity: { min: 5, max: 15 }
    },
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
    'Dây Gai': {
        description: 'item_day_gai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lõi Gỗ': {
        description: 'item_loi_go_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Bột Xương': {
        description: 'item_bot_xuong_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Magic',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nanh Sói': {
        description: 'item_nanh_soi_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        relationship: { substituteFor: 'Móng Vuốt Gấu', tier: 2 }
    },
    'Tơ Nhện Khổng lồ': {
        description: 'item_to_nhen_khong_lo_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🕸️',
        effects: [],
        baseQuantity: { min: 1, max: 3 },
        relationship: { substituteFor: 'Dây Gai', tier: 1 }
    },
    'Mắt Nhện': {
        description: 'item_mat_nhen_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '👁️',
        effects: [],
        baseQuantity: { min: 2, max: 8 }
    },
    'Da Heo Rừng': {
        description: 'item_da_heo_rung_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐗',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        relationship: { substituteFor: 'Da Gấu', tier: 2 }
    },
    'Móng Vuốt Gấu': {
        description: 'item_mong_vuot_gau_desc',
        tier: 4,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐾',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Da Gấu': {
        description: 'item_da_gau_desc',
        tier: 4,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐻',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Da Cáo': {
        description: 'item_da_cao_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Châu Chấu': {
        description: 'item_canh_chau_chau_desc',
        tier: 1,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦗',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Răng Linh Cẩu': {
        description: 'item_rang_linh_cau_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Rắn': {
        description: 'item_da_ran_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đuôi Bọ Cạp': {
        description: 'item_duoi_bo_cap_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Kền Kền': {
        description: 'item_long_ken_ken_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Chất nhờn của Đỉa': {
        description: 'item_chat_nhon_cua_dia_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Da Cá Sấu': {
        description: 'item_da_ca_sau_desc',
        tier: 4,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐊',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        relationship: { substituteFor: 'Da Gấu', tier: 1 }
    },
    'Răng Cá Sấu': {
        description: 'item_rang_ca_sau_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
        relationship: { substituteFor: 'Móng Vuốt Gấu', tier: 1 }
    },
    'Cánh Muỗi': {
        description: 'item_canh_muoi_desc',
        tier: 1,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦟',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Sừng Dê Núi': {
        description: 'item_sung_de_nui_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐐',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lông Harpie': {
        description: 'item_long_harpie_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 3, max: 6 }
    },
    'Da Báo Tuyết': {
        description: 'item_da_bao_tuyet_desc',
        tier: 4,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🐆',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Dơi': {
        description: 'item_canh_doi_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦇',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Độc Nhện Hang': {
        description: 'item_noc_doc_nhen_hang_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chất nhờn Slime': {
        description: 'item_chat_nhon_slime_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Răng Sâu Bò': {
        description: 'item_rang_sau_bo_desc',
        tier: 5,
        category: 'Material',
        subCategory: 'Loot',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nấm Độc': {
        description: 'item_nam_doc_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [], // No positive effects
        baseQuantity: { min: 1, max: 3 },
    },
    'Mũi Tên Cũ': {
        description: 'item_mui_ten_cu_desc',
        tier: 1,
        category: 'Material',
        emoji: '🏹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
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
    'Hoa Dại': {
        description: 'item_hoa_dai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌻',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Lông Chim Ưng': {
        description: 'item_long_chim_ung_desc',
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Hạt Giống Hoa Dại': {
        description: 'item_hat_giong_hoa_dai_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Cỏ Khô': {
        description: 'item_co_kho_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
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
        baseQuantity: { min: 1, max: 2 },
        relationship: { substituteFor: 'Đá Cuội', tier: 2 }
    },
    'Nọc Bọ Cạp': {
        description: 'item_noc_bo_cap_desc',
        tier: 4,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thủy tinh sa mạc': {
        description: 'item_thuy_tinh_sa_mac_desc',
        tier: 3,
        category: 'Material',
        emoji: '🔍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rêu Phát Sáng': {
        description: 'item_reu_phat_sang_desc',
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
    },
    'Trứng Bò Sát': {
        description: 'item_trung_bo_sat_desc',
        tier: 2,
        category: 'Material',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
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
        subCategory: 'Liquid',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        relationship: { substituteFor: 'Nước Ngầm', tier: 2 }
    },
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
        subCategory: 'Loot',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vỏ Chai': {
        description: 'item_da_vo_chai_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Weapon',
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
        baseQuantity: { min: 1, max: 2 },
        relationship: { substituteFor: 'Đá Cuội', tier: 1 }
    },
    'Cây Địa Y': {
        description: 'item_cay_dia_y_desc',
        tier: 2,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
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
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [],
        baseQuantity: { min: 2, max: 5 },
    },
    'Túi Trứng Nhện': {
        description: 'item_tui_trung_nhen_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
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
    'Đá Obsidian': {
        description: 'item_da_obsidian_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Magic',
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
    'Tro núi lửa': {
        description: 'item_tro_nui_lua_desc',
        tier: 1,
        category: 'Material',
        emoji: '🌋',
        effects: [],
        baseQuantity: { min: 1, max: 5 }
    },
};
