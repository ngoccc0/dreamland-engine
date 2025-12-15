

export const city_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trong một thành phố [adjective] và [feature].",
        ],
        medium: [
            "Những tòa nhà chọc trời vươn lên che khuất bầu trời [sky]. Không khí có mùi [smell] và tiếng [sound] của thành phố không bao giờ ngớt. {sensory_details} {entity_report}",
            "Ánh đèn neon [adjective] phản chiếu trên vỉa hè ẩm ướt. Tiếng [sound] của xe cộ và đám đông tạo thành một bản giao hưởng hỗn loạn. {sensory_details} {entity_report}",
        ],
        long: [
            "Bạn đứng giữa một đô thị [adjective] ngột ngạt, nơi những tòa nhà [feature] bằng thép và kính chọc thủng những đám mây ô nhiễm. Mùi [smell] của mưa và khói công nghiệp hòa quyện, và tiếng [sound] không ngừng tạo nên một khung cảnh vừa sôi động vừa đáng sợ. {sensory_details} {entity_report} {surrounding_peek}",
            "Màn đêm buông xuống thành phố [adjective] này, biến những con hẻm thành những lối đi đầy bí ẩn. Ánh đèn neon từ các [feature] hắt lên những bóng người vội vã, mỗi người mang một câu chuyện riêng, một bí mật riêng. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['neon', 'ẩm ướt', 'đông đúc', 'cyberpunk', 'cũ kỹ', 'hiện đại'],
    features: ['cao chọc trời', 'biển quảng cáo', 'hẻm tối', 'chợ đen', 'xe bay'],
    smells: ['mưa axit', 'mì ramen', 'rác thải', 'ozone'],
    sounds: ['còi xe', 'tiếng rao', 'nhạc điện tử', 'tiếng bước chân'],
    sky: ['ô nhiễm', 'xám xịt', 'đầy sao nhân tạo'],
    soilType: 'rocky',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
    creatures: [],
};

export const city_en = {
    descriptionTemplates: {
        short: [
            "You are in a [adjective] and [feature] city.",
        ],
        medium: [
            "Skyscrapers blot out the [sky] sky. The air smells of [smell] and the [sound] of the city is ceaseless. {sensory_details} {entity_report}",
            "[adjective] neon light reflects off the wet pavement. The [sound] of traffic and crowds forms a chaotic symphony. {sensory_details} {entity_report}",
        ],
        long: [
            "You stand amidst a stifling [adjective] metropolis, where [feature] of steel and glass pierce the polluted clouds. The [smell] of rain and industrial smog mingles, and the constant [sound] creates a scene both vibrant and intimidating. {sensory_details} {entity_report} {surrounding_peek}",
            "Night falls on this [adjective] city, turning alleys into mysterious pathways. Neon light from [feature] casts shadows on hurried figures, each with their own story, their own secret. {sensory_details} {entity_report} {surrounding_peek}",
        ],
    },
    adjectives: ['neon-lit', 'damp', 'crowded', 'cyberpunk', 'grimy', 'modern'],
    features: ['skyscrapers', 'holographic ads', 'dark alleys', 'black markets', 'flying vehicles'],
    smells: ['acid rain', 'ramen noodles', 'garbage', 'ozone'],
    sounds: ['sirens', 'hawkers', 'electronic music', 'footsteps'],
    sky: ['polluted', 'grey', 'artificial starlight'],
    soilType: 'rocky',
    NPCs: [],
    items: [],
    structures: [],
    enemies: [],
    creatures: [],
};
