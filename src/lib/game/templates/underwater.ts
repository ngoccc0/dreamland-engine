
export const underwater_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở dưới đáy đại dương [adjective]. Những [feature] kỳ lạ phát sáng trong bóng tối.",
        ],
        medium: [
            "Dòng nước [adjective] nhẹ nhàng đẩy bạn. Ánh sáng le lói từ trên mặt nước chiếu xuống, tạo ra những [feature] nhảy múa. Bạn nghe thấy tiếng [sound] từ xa. {sensory_details} {entity_report}",
            "Một cảm giác [adjective] bao trùm khi bạn nhìn vào vực thẳm xanh thẳm. Chỉ có những sinh vật tự phát sáng [feature] là nguồn sáng duy nhất. {sensory_details} {entity_report}",
        ],
        long: [
            "Bạn lơ lửng trong sự tĩnh lặng [adjective] của một vương quốc dưới nước. Ánh sáng mặt trời bị bẻ cong thành những tia sáng [feature] huyền ảo, chiếu rọi những khu vườn san hô đầy màu sắc. Tiếng [sound] của những sinh vật biển và dòng chảy tạo nên một bản giao hưởng của đại dương. {sensory_details} {entity_report} {surrounding_peek}",
            "Bóng tối của vực sâu [adjective] nuốt chửng mọi thứ. Chỉ có những sinh vật tự phát sáng [feature] là nguồn sáng duy nhất, và bạn có thể ngửi thấy mùi [smell] của khoáng chất từ các miệng phun thủy nhiệt. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['yên bình', 'sâu thẳm', 'bí ẩn', 'nguy hiểm'],
    features: ['san hô', 'cá phát quang', 'xác tàu đắm', 'miệng phun thủy nhiệt'],
    smells: ['muối', 'khoáng chất', 'tảo biển'],
    sounds: ['tiếng cá voi', 'tiếng nước sủi bọt', 'sự im lặng', 'tiếng rạn san hô'],
    sky: [],
    soilType: 'sandy',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
};

export const underwater_en = {
    descriptionTemplates: {
        short: [
            "You are at the bottom of the [adjective] ocean. Strange [feature] glow in the darkness.",
        ],
        medium: [
            "The [adjective] current gently pushes you. Faint light from the surface filters down, creating dancing [feature]. You hear the distant [sound]. {sensory_details} {entity_report}",
            "A feeling of [adjective] awe washes over you as you gaze into the blue abyss. Only the self-illuminating [feature] provide any light. {sensory_details} {entity_report}",
        ],
        long: [
            "You float in the [adjective] silence of an underwater kingdom. Sunlight refracts into magical [feature], illuminating colorful coral gardens. The [sound] of marine life and currents creates an ocean symphony. {sensory_details} {entity_report} {surrounding_peek}",
            "The darkness of the [adjective] abyss swallows everything. Only the self-illuminating [feature] provide any light, and you can smell the [smell] of minerals from hydrothermal vents. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['peaceful', 'deep', 'mysterious', 'dangerous'],
    features: ['coral', 'bioluminescent fish', 'shipwrecks', 'hydrothermal vents'],
    smells: ['salt', 'minerals', 'algae'],
    sounds: ['whale songs', 'bubbling water', 'silence', 'creaking coral'],
    sky: [],
    soilType: 'sandy',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
};
