/**
 * OVERVIEW: Catch-up messages and monologues for when player returns after idle time.
 * Templates use [TIME] placeholder that gets replaced with actual elapsed time.
 * TSDOC: Provides interval-based messages (15min, 1hour, 1day, 1week, 1month) + monologues by tone.
 * Supports bilingual content (EN/VI) for immersive experience when player resumes.
 */

export const catchUpMessages = {
    en: {
        // Interval-based catch-up messages (main message when time has passed)
        // Each interval has multiple variants to avoid repetition
        catchupInterval: {
            '15min': [
                '[TIME] has passed in the world...',
                '[TIME] went by while you were away.',
                'The world has progressed. [TIME] have slipped away.',
            ],
            '1hour': [
                '[TIME] has elapsed since you last ventured out.',
                '[TIME] have drifted by. The world has changed.',
                'An [TIME] has passed in your absence.',
            ],
            '1day': [
                '[TIME] has gone by! The world has shifted considerably.',
                '[TIME] have transformed the landscape around you.',
                'A full [TIME] has passed! Much has changed.',
            ],
            '1week': [
                '[TIME] have passed, and the world feels quite different now.',
                'Over a [TIME], seasons and tides have moved on.',
                'A [TIME] has turned. The world has evolved.',
            ],
            '1month': [
                '[TIME] have elapsed. The world is unrecognizable in places.',
                'An entire [TIME] has swept past! Everything feels different.',
                '[TIME] have reshaped the realm around you.',
            ],
        },

        // Monologues: emotional reactions when returning (pick by tone + [TIME] placeholder)
        // Six distinct tones to vary player's emotional state on resumption
        monologues: {
            surprised: [
                'Wow, it felt like just a few minutes, but [TIME] have passed! Time flies.',
                'Wait, [TIME] already? It seemed like just moments ago...',
                'Did [TIME] really go by that fast? Wow.',
                'I lost track of time... [TIME] have disappeared in what felt like a blink.',
            ],
            wistful: [
                'Hmm, [TIME] have gone by. I wonder what I missed...',
                '[TIME] have passed, and I feel like I wasn\'t here to see it all unfold.',
                'Funny how [TIME] can slip away without you noticing.',
                '[TIME] have drifted past like a dream.',
            ],
            wonder: [
                'The world has changed so much in just [TIME]... I wonder what happened while I was gone.',
                '[TIME] have changed everything. What did I miss?',
                'It\'s incredible how much can shift in [TIME].',
                '[TIME] have transformed this place. The stories this landscape could tell...',
            ],
            anxious: [
                '[TIME] have passed... I hope nothing too terrible happened.',
                'I\'ve been away for [TIME]. What if something urgent came up?',
                '[TIME]... that\'s quite a bit of time to be gone.',
                'I\'m worried I missed something important in those [TIME].',
            ],
            content: [
                '[TIME] have gone by, and the world looks peaceful.',
                'It\'s nice to return after [TIME]. Everything seems calm.',
                '[TIME] have passed, and life has kept its gentle rhythm.',
                'A quiet [TIME] has settled over everything.',
            ],
            energized: [
                '[TIME] away, and I\'m ready to get back into it!',
                'After [TIME], I feel refreshed and eager to explore again.',
                '[TIME] have given me time to recharge. Let\'s see what\'s changed!',
                'Time for a new chapter! [TIME] have passed, and I\'m ready for adventure.',
            ],
        },

        // Impact descriptions (optional: summarize what changed in the world)
        impacts: {
            plantGrowth: '[COUNT] plants are now ready to harvest.',
            creaturesSpawned: '[COUNT] new creatures have appeared.',
            weatherChanged: 'The weather has shifted to [WEATHER].',
            structuresDecayed: '[COUNT] structures have begun to decay.',
            erosionProgressed: 'Erosion has advanced across the terrain.',
            wildlifeMultiplied: 'The animal population has grown.',
        },
    },

    vi: {
        // Khoảng thời gian catch-up messages (Vietnamese)
        catchupInterval: {
            '15min': [
                '[TIME] đã trôi qua trong thế giới...',
                '[TIME] đã qua trong lúc bạn vắng mặt.',
                'Thế giới đã tiến triển. [TIME] đã trôi qua.',
            ],
            '1hour': [
                '[TIME] đã trôi qua kể từ lần cuối cùng bạn ra ngoài.',
                '[TIME] đã trôi qua. Thế giới đã thay đổi.',
                'Một [TIME] đã qua.',
            ],
            '1day': [
                '[TIME] đã trôi qua! Thế giới đã thay đổi đáng kể.',
                '[TIME] đã biến đổi cảnh quan xung quanh bạn.',
                'Cả [TIME] đã trôi qua! Rất nhiều thứ đã thay đổi.',
            ],
            '1week': [
                '[TIME] đã trôi qua, và thế giới cảm thấy khác biệt rất nhiều.',
                'Qua hơn [TIME], những mùa và thủy triều đã tiến triển.',
                'Một [TIME] đã xoay quanh. Thế giới đã phát triển.',
            ],
            '1month': [
                '[TIME] đã trôi qua. Thế giới không thể nhận ra ở nhiều nơi.',
                'Cả [TIME] đã lướt qua! Mọi thứ cảm thấy khác biệt.',
                '[TIME] đã làm thay đổi hình dạng thế giới xung quanh bạn.',
            ],
        },

        monologues: {
            surprised: [
                'Wow, cảm giác như mới vài phút mà [TIME] rồi à! Nhanh thật.',
                'Chờ đã, [TIME] rồi hả? Cảm giác như mới xong chút đỉnh...',
                '[TIME] có thực sự trôi qua vậy nhanh không? Wow.',
                'Tôi mất kiến thức về thời gian... [TIME] đã biến mất trong thoáng chốc.',
            ],
            wistful: [
                'Hmm, [TIME] đã trôi qua. Tôi tự hỏi tôi đã bỏ lỡ điều gì...',
                '[TIME] đã trôi qua, và tôi cảm thấy tôi không ở đây để thấy tất cả.',
                'Thật buồn cười khi [TIME] có thể trôi qua mà không ai nhận thấy.',
                '[TIME] đã trôi qua như một giấc mơ.',
            ],
            wonder: [
                'Thế giới đã thay đổi rất nhiều chỉ trong [TIME]... Tôi tự hỏi điều gì đã xảy ra.',
                '[TIME] đã thay đổi mọi thứ. Tôi đã bỏ lỡ điều gì?',
                'Thật không thể tin được có thể thay đổi bao nhiêu trong [TIME].',
                '[TIME] đã biến đổi nơi này. Những câu chuyện cảnh quan này có thể kể...',
            ],
            anxious: [
                '[TIME] đã trôi qua... Tôi hy vọng không có gì tồi tệ xảy ra.',
                'Tôi đã vắng mặt trong [TIME]. Điều gì nếu điều gì đó khẩn cấp xảy ra?',
                '[TIME]... đó là khá nhiều thời gian để vắng mặt.',
                'Tôi lo lắng tôi đã bỏ lỡ điều gì đó quan trọng trong [TIME].',
            ],
            content: [
                '[TIME] đã trôi qua, và thế giới trông yên bình.',
                'Thật tuyệt vời khi trở lại sau [TIME]. Mọi thứ dường như yên tĩnh.',
                '[TIME] đã trôi qua, và cuộc sống giữ nhịp độ nhẹ nhàng của nó.',
                'Một [TIME] yên tĩnh đã định cư lên mọi thứ.',
            ],
            energized: [
                '[TIME] vắng mặt, và tôi sẵn sàng để quay lại!',
                'Sau [TIME], tôi cảm thấy tươi mới và sẵn sàng khám phá lại.',
                '[TIME] đã cho tôi thời gian để sạc lại. Hãy xem những gì đã thay đổi!',
                'Đến lúc bắt đầu chương mới! [TIME] đã trôi qua, và tôi sẵn sàng cho phiêu lưu.',
            ],
        },

        impacts: {
            plantGrowth: '[COUNT] cây đã sẵn sàng để thu hoạch.',
            creaturesSpawned: '[COUNT] sinh vật mới đã xuất hiện.',
            weatherChanged: 'Thời tiết đã chuyển sang [WEATHER].',
            structuresDecayed: '[COUNT] cấu trúc đã bắt đầu phân hủy.',
            erosionProgressed: 'Xói mòn đã tiến triển trên toàn bộ địa hình.',
            wildlifeMultiplied: 'Dân số động vật đã tăng lên.',
        },
    },
};

/**
 * Helper function to format time elapsed into readable string.
 * Calculates which interval (15min, 1hour, 1day, 1week, 1month) the elapsed ticks fall into,
 * and returns a human-readable label for that duration.
 *
 * @param elapsedTicks - Number of game ticks that have elapsed
 * @param tickGameDurationMinutes - How many in-game minutes each tick represents (default 15)
 * @returns Object with interval key and human-readable label (e.g., "3 days", "2 weeks")
 */
export function getTimeIntervalFromTicks(
    elapsedTicks: number,
    tickGameDurationMinutes: number = 15,
): { interval: '15min' | '1hour' | '1day' | '1week' | '1month'; label: string } {
    const totalGameMinutes = elapsedTicks * tickGameDurationMinutes;
    const totalGameHours = totalGameMinutes / 60;
    const totalGameDays = totalGameHours / 24;
    const totalGameWeeks = totalGameDays / 7;
    const totalGameMonths = totalGameDays / 30;

    // Determine interval: largest unit that >= 1
    if (totalGameMonths >= 1) {
        const monthCount = Math.floor(totalGameMonths);
        return {
            interval: '1month',
            label: monthCount === 1 ? '1 month' : `${monthCount} months`,
        };
    } else if (totalGameWeeks >= 1) {
        const weekCount = Math.floor(totalGameWeeks);
        return {
            interval: '1week',
            label: weekCount === 1 ? '1 week' : `${weekCount} weeks`,
        };
    } else if (totalGameDays >= 1) {
        const dayCount = Math.floor(totalGameDays);
        return {
            interval: '1day',
            label: dayCount === 1 ? '1 day' : `${dayCount} days`,
        };
    } else if (totalGameHours >= 1) {
        const hourCount = Math.floor(totalGameHours);
        return {
            interval: '1hour',
            label: hourCount === 1 ? '1 hour' : `${hourCount} hours`,
        };
    } else {
        const minuteCount = Math.floor(Math.max(1, totalGameMinutes));
        return {
            interval: '15min',
            label: minuteCount === 1 ? '1 minute' : `${minuteCount} minutes`,
        };
    }
}

/**
 * Helper to randomly select from array.
 * Used to pick random templates when multiple variants exist.
 *
 * @param arr - Array to pick from
 * @returns Random element from array
 */
export function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Helper to replace [TIME] placeholder in template with actual time label.
 * Also handles [COUNT], [WEATHER] if needed for future extensibility.
 *
 * @param template - Template string with [TIME], [COUNT], etc. placeholders
 * @param timeLabel - Human-readable time label (e.g., "3 days")
 * @returns Template with placeholders replaced
 */
export function fillTimeTemplate(template: string, timeLabel: string): string {
    return template.replace(/\[TIME\]/g, timeLabel);
}

/**
 * Extended version: replace multiple placeholders
 * @param template - Template string with [PLACEHOLDER] syntax
 * @param replacements - Object mapping placeholder names to values
 * @returns Template with all replacements applied
 */
export function fillTemplateWithReplacements(
    template: string,
    replacements: Record<string, string>,
): string {
    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        result = result.replace(regex, value);
    });
    return result;
}
