import type { BiomeTemplateData } from '@/lib/game/types';

export const biomeNarrativeTemplates: Record<string, BiomeTemplateData> = {
  "Jungle": {
    terrain: "Jungle",
    descriptionTemplates: [
      {
        id: "jungle_opening_gloomy",
        type: "Opening",
        mood: ["Foreboding", "Gloomy"],
        length: "long",
        conditions: {"lightLevel": {"max": 0}},
        weight: 0.7,
        template: "Một bức màn {{adjective_dark}} bao trùm {{jungle_terrain_desc}}. Ánh sáng {{light_level_detail}} chỉ đủ để nhận ra những hình thù {{vague_shape_adj}} mờ ảo, như thể khu rừng đang {{jungle_feeling_dark}}."
      },
      {
        id: "jungle_opening_lush",
        type: "Opening",
        mood: ["Peaceful", "Lush"],
        length: "medium",
        conditions: {"lightLevel": {"min": 5}, "moisture": {"min": 5}},
        weight: 0.5,
        template: "Bạn đang len lỏi giữa {{jungle_terrain_desc_lush}}. Không khí {{temp_detail}} và {{moisture_detail}} bao trùm, mang theo {{smell_detail_lush}}."
      },
      {
        id: "entity_report_danger",
        type: "EntityReport",
        mood: ["Danger"],
        length: "medium",
        conditions: {"predatorPresence": {"min": 5}},
        weight: 1.0,
        template: "Đột nhiên, bạn cảm nhận được {sensory_detail_danger}. {entity_report_detail}!"
      },
      {
        id: "sensory_detail_gloomy",
        type: "SensoryDetail",
        mood: ["Gloomy", "Dark"],
        length: "long",
        conditions: {"lightLevel": {"max": 0}},
        weight: 0.8,
        template: "Không khí {{temp_detail_gloomy}} và {{moisture_detail_gloomy}}, khiến bạn cảm thấy {{feeling_gloomy}}."
      },
      {
        id: "closing_peaceful",
        type: "Closing",
        mood: ["Peaceful"],
        length: "medium",
        conditions: {},
        weight: 0.6,
        template: "Tâm trí bạn được xoa dịu bởi sự yên bình của nơi này."
      }
    ],
    adjectives: {
      "adjective_dark": ["âm u", "u ám", "tăm tối", "lạnh lẽo"],
      "jungle_terrain_desc": ["thảm thực vật chằng chịt", "khu rừng bạt ngàn", "tán lá dày đặc", "lối đi rậm rạp"],
      "jungle_terrain_desc_lush": ["những tán lá xanh tươi", "thảm thực vật sum suê", "khu rừng trù phú"],
      "vague_shape_adj": ["kỳ dị", "ma mị", "không rõ ràng", "ẩn hiện"],
    },
    features: {
        "main_feature": ["một dòng suối nhỏ", "một cụm cây cổ thụ", "một vách đá phủ rêu"],
    },
    smells: {
        "smell_dark": ["mùi ẩm mốc", "mùi đất mục", "mùi nồng của lá chết"],
        "smell_lush": ["mùi hoa dại", "mùi đất ẩm tươi", "hương vị của sự sống"],
    },
    sounds: {
        "sound_dark": ["tiếng côn trùng rỉ rả", "tiếng gió rít qua kẽ lá", "âm thanh ghê rợn"],
        "sound_lush": ["tiếng chim hót líu lo", "tiếng nước chảy róc rách", "tiếng lá xào xạc"],
    },
    sky: {
        "sky_general": ["bầu trời u ám", "những vệt sáng hiếm hoi", "tán lá che khuất bầu trời"],
    }
  },
  // We can add other biomes like "Desert", "Mountain" here later.
};
