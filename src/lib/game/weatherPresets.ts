import type { WeatherState } from "./types";

export const weatherPresets: WeatherState[] = [
    // --- NEUTRAL ---
    {
        name: 'Clear Skies',
        description: 'Bầu trời quang đãng, không một gợn mây.',
        biome_affinity: ['forest', 'grassland', 'desert', 'swamp', 'mountain'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 0,
        wind_delta: 0,
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [20, 40] // Long duration for default weather
    },

    // --- POSITIVE/MILD ---
    {
        name: 'Gentle Breeze',
        description: 'Một làn gió nhẹ thổi qua, mang theo không khí trong lành.',
        biome_affinity: ['grassland', 'mountain', 'forest'],
        season_affinity: ['spring', 'summer'],
        temperature_delta: -1,
        moisture_delta: 0,
        wind_delta: 2,
        spawnWeight: 8,
        exclusive_tags: ['windy'],
        duration_range: [10, 20]
    },
    {
        name: 'Light Rain',
        description: 'Một cơn mưa phùn nhẹ bắt đầu rơi, làm dịu đi không khí.',
        biome_affinity: ['forest', 'grassland', 'swamp'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -2,
        moisture_delta: 2,
        wind_delta: 1,
        spawnWeight: 7,
        exclusive_tags: ['rain'],
        duration_range: [15, 30]
    },

    // --- NEGATIVE/HARSH ---
    {
        name: 'Heavy Rain',
        description: 'Mưa bắt đầu trút xuống nặng hạt, làm mặt đất trở nên lầy lội.',
        biome_affinity: ['forest', 'swamp'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -3,
        moisture_delta: 4,
        wind_delta: 3,
        spawnWeight: 4,
        exclusive_tags: ['rain', 'storm'],
        duration_range: [10, 20]
    },
    {
        name: 'Thick Fog',
        description: 'Sương mù dày đặc bao trùm lấy cảnh vật, tầm nhìn bị hạn chế rất nhiều.',
        biome_affinity: ['swamp', 'forest', 'mountain'],
        season_affinity: ['autumn', 'winter', 'spring'],
        temperature_delta: -1,
        moisture_delta: 1,
        wind_delta: -2,
        spawnWeight: 5,
        exclusive_tags: ['fog'],
        duration_range: [20, 35]
    },
    {
        name: 'Scorching Sun',
        description: 'Cái nóng như thiêu như đốt của mặt trời khiến không khí trở nên ngột ngạt.',
        biome_affinity: ['desert', 'grassland'],
        season_affinity: ['summer'],
        temperature_delta: 4,
        moisture_delta: -3,
        wind_delta: 0,
        spawnWeight: 6,
        exclusive_tags: ['heat'],
        duration_range: [15, 25]
    },
    {
        name: 'Snowfall',
        description: 'Những bông tuyết trắng bắt đầu rơi nhẹ nhàng từ trên trời, phủ một lớp mỏng lên mặt đất.',
        biome_affinity: ['mountain', 'forest'],
        season_affinity: ['winter'],
        temperature_delta: -5,
        moisture_delta: 1,
        wind_delta: 1,
        spawnWeight: 7,
        exclusive_tags: ['snow', 'cold'],
        duration_range: [20, 40]
    },
    {
        name: 'Blizzard',
        description: 'Một trận bão tuyết dữ dội nổi lên, gió rít lên từng hồi và tuyết rơi dày đặc.',
        biome_affinity: ['mountain'],
        season_affinity: ['winter'],
        temperature_delta: -8,
        moisture_delta: 2,
        wind_delta: 6,
        spawnWeight: 2,
        exclusive_tags: ['snow', 'cold', 'storm', 'windy'],
        duration_range: [10, 20]
    },
    {
        name: 'Sandstorm',
        description: 'Gió nổi lên, cuốn theo cát bụi tạo thành một cơn bão cát mịt mù.',
        biome_affinity: ['desert'],
        season_affinity: ['summer', 'autumn'],
        temperature_delta: 1,
        moisture_delta: -2,
        wind_delta: 7,
        spawnWeight: 3,
        exclusive_tags: ['windy', 'storm'],
        duration_range: [10, 20]
    },
    
    // --- CAVE (Special) ---
    {
        name: 'Damp Stillness',
        description: 'Không khí trong hang ẩm ướt và tĩnh lặng đến lạ thường.',
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 1,
        wind_delta: -5, // Caves are not windy
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [30, 60]
    },
    {
        name: 'Mysterious Draft',
        description: 'Một luồng gió lạnh lẽo không rõ từ đâu thổi qua các khe đá.',
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: -2,
        moisture_delta: 0,
        wind_delta: 2,
        spawnWeight: 5,
        exclusive_tags: ['windy'],
        duration_range: [15, 30]
    }
];
