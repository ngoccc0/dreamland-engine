
export const space_station_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trên một trạm không gian [adjective]. Hành lang kim loại [feature] trải dài trước mắt.",
        ],
        medium: [
            "Không khí có mùi [smell] và tái chế. Ánh sáng [adjective] từ các bảng điều khiển hắt lên, và bạn nghe thấy tiếng [sound] của hệ thống hỗ trợ sự sống. {sensory_details} {entity_report}",
            "Bên ngoài cửa sổ là một khoảng không [feature] vô tận. Hành lang [adjective] này vắng lặng một cách đáng sợ. {sensory_details} {entity_report}",
        ],
        long: [
            "Bạn trôi trong không trọng lực của một trạm không gian [adjective] khổng lồ, một thành phố kim loại giữa các vì sao. Mùi [smell] của ozon và dầu máy tràn ngập không khí, bị át đi bởi tiếng [sound] đều đều của các máy lọc không khí. Qua lớp kính dày, vũ trụ [feature] trải dài vô tận. {sensory_details} {entity_report} {surrounding_peek}",
            "Hành lang [adjective] này vắng lặng một cách đáng sợ. Chỉ có ánh sáng từ các [feature] nhấp nháy trên tường, và tiếng vọng của bước chân bạn trên sàn kim loại. Một cảm giác cô độc và bất an xâm chiếm. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['im lặng', 'bị bỏ hoang', 'công nghệ cao', 'chật chội'],
    features: ['đầy sao', 'bảng điều khiển', 'cửa sập', 'phòng thí nghiệm'],
    smells: ['kim loại', 'ozon', 'dầu máy', 'không khí tái chế'],
    sounds: ['tiếng quạt thông gió', 'tiếng bíp của máy tính', 'sự im lặng tuyệt đối', 'tiếng cửa đóng'],
    sky: [],
    soilType: 'metal',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
};

export const space_station_en = {
    descriptionTemplates: {
        short: [
            "You are on a [adjective] space station. The [feature] metal corridor stretches before you.",
        ],
        medium: [
            "The air smells [smell] and recycled. [adjective] light from the control panels casts a glow, and you hear the [sound] of the life support systems. {sensory_details} {entity_report}",
            "Outside the viewport is an endless expanse of [feature]. This [adjective] corridor is eerily silent. {sensory_details} {entity_report}",
        ],
        long: [
            "You float in the zero-gravity of a massive, [adjective] space station, a metal city among the stars. The [smell] of ozone and machine oil fills the air, punctuated by the steady [sound] of air scrubbers. Through the thick viewport, the [feature] universe stretches on infinitely. {sensory_details} {entity_report} {surrounding_peek}",
            "This [adjective] corridor is eerily silent. There's only the light from flashing [feature] on the walls, and the echo of your own footsteps on the metal deck. A sense of solitude and unease settles in. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['silent', 'abandoned', 'high-tech', 'claustrophobic'],
    features: ['starlit void', 'control panels', 'bulkheads', 'laboratories'],
    smells: ['metal', 'ozone', 'machine oil', 'recycled air'],
    sounds: ['hum of vents', 'beeping computers', 'total silence', 'hiss of a door'],
    sky: [],
    soilType: 'metal',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
};
