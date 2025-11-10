import { z } from 'zod';

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