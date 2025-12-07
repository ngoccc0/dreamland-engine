
import type { WeatherDefinition } from "./definitions";

/**
 * OVERVIEW: Weather preset modifiers as PERCENTAGES of biome temperature range.
 * These apply percentage multipliers to base biome temperature.
 * Formula: finalTemp = baseTemp × (1 + temperatureModPercent)
 * Range: -30°C to +50°C (80°C span)
 * 
 * Example conversions from fixed deltas to percentages:
 * - Old +4 fixed = +5% (for heatwave)
 * - Old -5 fixed = -6% (for snowfall)
 * - Old -3 fixed = -4% (for heavy rain)
 */
export const weatherPresets: WeatherDefinition[] = [
    // --- NEUTRAL ---
    {
        id: 'clear',
        name: { en: 'Clear Skies', vi: 'Trời quang' },
        description: { en: 'The sky is clear, without a single cloud.', vi: 'Trời quang đãng, không một gợn mây.' },
        biome_affinity: ['forest', 'grassland', 'desert', 'swamp', 'mountain', 'jungle', 'tundra', 'beach', 'mesa'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 0,
        wind_delta: 0,
        light_delta: 0,
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [20, 40]
    },

    // --- POSITIVE/MILD ---
    {
        id: 'breeze',
        name: { en: 'Gentle Breeze', vi: 'Gió nhẹ' },
        description: { en: 'A gentle breeze blows through, bringing fresh air.', vi: 'Một làn gió nhẹ thổi qua, mang theo không khí trong lành.' },
        biome_affinity: ['grassland', 'mountain', 'forest', 'jungle', 'beach', 'mesa'],
        season_affinity: ['spring', 'summer'],
        temperature_delta: -0.01, // -1%
        moisture_delta: 0,
        wind_delta: 2,
        light_delta: 0,
        spawnWeight: 8,
        exclusive_tags: ['windy'],
        duration_range: [10, 20]
    },
    {
        id: 'light_rain',
        name: { en: 'Light Rain', vi: 'Mưa nhẹ' },
        description: { en: 'A light drizzle begins to fall, cooling the air.', vi: 'Một cơn mưa phùn bắt đầu rơi, làm mát không khí.' },
        biome_affinity: ['forest', 'grassland', 'swamp', 'jungle', 'mushroom_forest', 'beach'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -0.025, // -2.5%
        moisture_delta: 2,
        wind_delta: 1,
        light_delta: -1,
        spawnWeight: 7,
        exclusive_tags: ['rain'],
        duration_range: [15, 30]
    },

    // --- NEGATIVE/HARSH ---
    {
        id: 'heavy_rain',
        name: { en: 'Heavy Rain', vi: 'Mưa lớn' },
        description: { en: 'The rain begins to pour down, making the ground muddy.', vi: 'Mưa bắt đầu đổ xuống, làm cho mặt đất trở nên lầy lội.' },
        biome_affinity: ['forest', 'swamp', 'jungle', 'mushroom_forest'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -0.04, // -4%
        moisture_delta: 4,
        wind_delta: 3,
        light_delta: -3,
        spawnWeight: 4,
        exclusive_tags: ['rain', 'storm'],
        duration_range: [10, 20]
    },
    {
        id: 'fog',
        name: { en: 'Thick Fog', vi: 'Sương mù dày đặc' },
        description: { en: 'A thick fog envelops the landscape, greatly reducing visibility.', vi: 'Một lớp sương mù dày đặc bao trùm cảnh quan, làm giảm đáng kể tầm nhìn.' },
        biome_affinity: ['swamp', 'forest', 'mountain', 'jungle', 'tundra', 'mushroom_forest'],
        season_affinity: ['autumn', 'winter', 'spring'],
        temperature_delta: -0.01, // -1%
        moisture_delta: 1,
        wind_delta: -2,
        light_delta: -4,
        spawnWeight: 5,
        exclusive_tags: ['fog'],
        duration_range: [20, 35]
    },
    {
        id: 'heatwave',
        name: { en: 'Scorching Sun', vi: 'Nắng gắt' },
        description: { en: 'The scorching heat of the sun makes the air feel oppressive.', vi: 'Cái nóng như thiêu đốt của mặt trời làm cho không khí trở nên ngột ngạt.' },
        biome_affinity: ['desert', 'grassland', 'volcanic', 'mesa', 'beach'],
        season_affinity: ['summer'],
        temperature_delta: 0.05, // +5%
        moisture_delta: -3,
        wind_delta: 0,
        light_delta: 2,
        spawnWeight: 6,
        exclusive_tags: ['heat'],
        duration_range: [15, 25]
    },
    {
        id: 'snowfall',
        name: { en: 'Snowfall', vi: 'Tuyết rơi' },
        description: { en: 'White snowflakes begin to fall gently from the sky, covering the ground in a thin layer.', vi: 'Những bông tuyết trắng bắt đầu rơi nhẹ nhàng từ trên trời, phủ một lớp mỏng lên mặt đất.' },
        biome_affinity: ['mountain', 'forest', 'tundra'],
        season_affinity: ['winter'],
        temperature_delta: -0.065, // -6.5%
        moisture_delta: 1,
        wind_delta: 1,
        light_delta: -1,
        spawnWeight: 7,
        exclusive_tags: ['snow', 'cold'],
        duration_range: [20, 40]
    },
    {
        id: 'blizzard',
        name: { en: 'Blizzard', vi: 'Bão tuyết' },
        description: { en: 'A fierce blizzard erupts, with wind howling and heavy snow falling.', vi: 'Một trận bão tuyết dữ dội bùng phát, với gió hú và tuyết rơi dày đặc.' },
        biome_affinity: ['mountain', 'tundra'],
        season_affinity: ['winter'],
        temperature_delta: -0.1, // -10%
        moisture_delta: 2,
        wind_delta: 6,
        light_delta: -5,
        spawnWeight: 2,
        exclusive_tags: ['snow', 'cold', 'storm', 'windy'],
        duration_range: [10, 20]
    },
    {
        id: 'sandstorm',
        name: { en: 'Sandstorm', vi: 'Bão cát' },
        description: { en: 'The wind picks up, carrying sand and dust, creating a blinding sandstorm.', vi: 'Gió nổi lên, mang theo cát và bụi, tạo thành một cơn bão cát mù mịt.' },
        biome_affinity: ['desert', 'mesa', 'beach'],
        season_affinity: ['summer', 'autumn'],
        temperature_delta: 0.015, // +1.5%
        moisture_delta: -2,
        wind_delta: 7,
        light_delta: -4,
        spawnWeight: 3,
        exclusive_tags: ['windy', 'storm'],
        duration_range: [10, 20]
    },

    // --- SPECIAL BIOME WEATHER ---
    {
        id: 'cave_stillness',
        name: { en: 'Damp Stillness', vi: 'Không khí ẩm và tĩnh lặng' },
        description: { en: 'The air in the cave is damp and strangely still.', vi: 'Không khí trong hang ẩm ướt và tĩnh lặng một cách kỳ lạ.' },
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0, // 0%
        moisture_delta: 1,
        wind_delta: -5,
        light_delta: 0,
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [30, 60]
    },
    {
        id: 'cave_draft',
        name: { en: 'Mysterious Draft', vi: 'Luồng gió bí ẩn' },
        description: { en: 'A cold draft blows from an unknown source through the rock crevices.', vi: 'Một luồng gió lạnh thổi từ một nguồn không xác định qua các khe đá.' },
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: -0.025, // -2.5%
        moisture_delta: 0,
        wind_delta: 2,
        light_delta: 0,
        spawnWeight: 5,
        exclusive_tags: ['windy'],
        duration_range: [15, 30]
    },
    {
        id: 'ashfall',
        name: { en: 'Ashfall', vi: 'Mưa tro' },
        description: { en: 'Ash from the nearby volcano begins to fall, covering everything in a layer of gray dust.', vi: 'Tro từ ngọn núi lửa gần đó bắt đầu rơi xuống, phủ một lớp bụi xám lên mọi thứ.' },
        biome_affinity: ['volcanic'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0.015, // +1.5%
        moisture_delta: -1,
        wind_delta: 1,
        light_delta: -3,
        spawnWeight: 8,
        exclusive_tags: ['ash'],
        duration_range: [15, 30]
    },
    {
        id: 'spore_cloud',
        name: { en: 'Spore Cloud', vi: 'Mây bào tử' },
        description: { en: 'The air is thick with glowing spores, dancing in the air.', vi: 'Không khí đặc quánh những bào tử phát sáng, nhảy múa trong không trung.' },
        biome_affinity: ['mushroom_forest'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0, // 0%
        moisture_delta: 1,
        wind_delta: 0,
        light_delta: 2,
        spawnWeight: 9,
        exclusive_tags: ['spores', 'magic'],
        duration_range: [20, 40]
    }
];
