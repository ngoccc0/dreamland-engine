// This file contains detailed sensory information for specific items and enemies.

export interface SensoryData {
    adjective?: string;
    sense_effect?: {
        smell?: string;
        appearance?: string;
        sound?: string;
        general?: string;
    };
}

// Using Translation Keys for multi-language support
export const itemSensoryDB_vi: Record<string, SensoryData> = {
    "Nấm Độc": {
        adjective: "độc",
        sense_effect: {
            smell: "hắc nồng của đất mục và lưu huỳnh",
            appearance: "màu tím sẫm với những đốm xanh kỳ dị",
            sound: "một tiếng 'xì xì' nhẹ khi chạm vào",
            general: "trông đầy đe dọa"
        }
    },
    "Quả Mọng Ăn Được": {
        adjective: "ngon ngọt",
        sense_effect: {
            smell: "thơm lừng mùi mật ong và quả dại",
            appearance: "đỏ mọng, căng tròn như những viên ngọc",
            sound: "tiếng 'lách tách' nhẹ khi bứt khỏi cành",
            general: "trông thật hấp dẫn"
        }
    },
    "Quả Lạ": {
        adjective: "kỳ lạ",
        sense_effect: {
            smell: "pha trộn giữa hương hoa lạ và chút vị chát",
            appearance: "có vỏ ngoài lốm đốm màu sắc không thể xác định",
            general: "kích thích sự tò mò"
        }
    },
    "Lá cây lớn": {
        adjective: "lớn",
        sense_effect: {
            smell: "mùi ẩm của rêu và đất",
            appearance: "xanh thẫm, rộng bằng bàn tay người lớn",
            sound: "khẽ xào xạc trong gió",
            general: "có thể dùng để che chắn"
        }
    },
    "Hoa Tinh Linh": {
        adjective: "linh thiêng",
        sense_effect: {
            smell: "mùi hương thanh khiết, như sương sớm",
            appearance: "phát ra ánh sáng xanh lam dịu nhẹ, cánh hoa trong suốt",
            sound: "một âm thanh ngân nga rất khẽ khi nở",
            general": "mang vẻ đẹp siêu nhiên"
        }
    },
};

export const enemySensoryDB_vi: Record<string, SensoryData> = {
    "Thỏ hoang hung dữ": {
        adjective: "hung tợn",
    },
    "Khỉ đột": {
        adjective: "khổng lồ",
    }
};


// English Versions
export const itemSensoryDB_en: Record<string, SensoryData> = {
    "Poisonous Mushroom": {
        adjective: "poisonous",
        sense_effect: {
            smell: "a pungent odor of decay and sulfur",
            appearance: "dark purple with strange green spots",
            sound: "a faint 'hiss' upon touch",
            general: "looks threatening"
        }
    },
    "Edible Berries": {
        adjective: "sweet",
        sense_effect: {
            smell: "a fragrant scent of honey and wild fruit",
            appearance: "plump and red, like juicy gems",
            sound: "a soft 'snap' when picked from the stem",
            general: "looks very tempting"
        }
    },
    "Strange Fruit": {
        adjective: "strange",
        sense_effect: {
            smell: "a mix of unfamiliar floral notes and a hint of tartness",
            appearance: "has a mottled rind of indeterminate colors",
            general: "piques curiosity"
        }
    },
    "Large Leaf": {
        adjective: "large",
        sense_effect: {
            smell: "the damp scent of moss and earth",
            appearance: "deep green, as wide as an adult's hand",
            sound: "rustles softly in the wind",
            general": "could be used for cover"
        }
    },
    "Spirit Bloom": {
        adjective: "ethereal",
        sense_effect: {
            smell: "a pure fragrance, like morning dew",
            appearance: "emits a soft blue light, its petals are translucent",
            sound: "a very faint chime as it blooms",
            general": "has a supernatural beauty"
        }
    },
};

export const enemySensoryDB_en: Record<string, SensoryData> = {
    "Aggressive Rabbit": {
        adjective: "aggressive",
    },
    "Gorilla": {
        adjective: "enormous",
    }
};

export const getSensoryDB = (language: 'vi' | 'en') => {
    return {
        itemDB: language === 'vi' ? itemSensoryDB_vi : itemSensoryDB_en,
        enemyDB: language === 'vi' ? enemySensoryDB_vi : enemySensoryDB_en,
    }
}
