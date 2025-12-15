// Simple conditional movement templates (minimal set).
// This file contains a small, prioritized list of movement templates for
// different conditions. The selector will try to match the most specific
// template first.

export const movementTemplates: Record<string, Array<{ id: string; conditions?: any; template: string }>> = {
    en: [
        {
            id: 'pitch_black',
            conditions: { lightMax: 5, requireNoLight: true },
            template: "You inch {direction} through impenetrable darkness, hands stretched before you like a blind man's lifeline. Every step is a gamble in this void. {brief_sensory}"
        },
        {
            id: 'night_no_light',
            conditions: { lightMax: 10, requireNoLight: true },
            template: "Shadows dance at the edge of sight as you carefully pick your way {direction}, each step a negotiation with the unseen. {brief_sensory}"
        },
        {
            id: 'stormy_weather',
            conditions: { weather: 'storm' },
            template: "Lightning splits the sky as you battle {direction} against howling winds. The storm's fury makes every step a struggle for balance. {brief_sensory}"
        },
        {
            id: 'heavy_rain',
            conditions: { weather: 'rain' },
            template: "Through sheets of rain you press {direction}, clothes heavy and dripping. The downpour drums a relentless rhythm on your shoulders. {brief_sensory}"
        },
        {
            id: 'deep_mud',
            conditions: { moistureMin: 90 },
            template: "The thick mud greedily tries to claim your boots as you slog {direction}. Each step is a small victory against the sucking earth. {brief_sensory}"
        },
        {
            id: 'swamp_muddy',
            conditions: { moistureMin: 80 },
            template: "Murky water splashes around your boots as you pick your way {direction}, testing each step on treacherous ground. {brief_sensory}"
        },
        {
            id: 'freezing_cold',
            conditions: { temperatureMax: 0 },
            template: "The bitter cold bites deep into your bones as you forge {direction}. Your breath crystallizes instantly in the freezing air. {brief_sensory}"
        },
        {
            id: 'cold_bite',
            conditions: { temperatureMax: 10 },
            template: "Shivering against the chill, you press {direction}. Your muscles ache with the cold as you huddle deeper into your clothing. {brief_sensory}"
        },
        {
            id: 'scorching_heat',
            conditions: { temperatureMin: 40 },
            template: "The merciless sun beats down as you trudge {direction}, heat waves distorting the air before you. Sweat trickles down your back. {brief_sensory}"
        },
        {
            id: 'exhausted',
            conditions: { staminaBelow: 10 },
            template: "Your vision swims as you stumble {direction}, each step a monumental effort. The world seems to sway with your exhaustion. {brief_sensory}"
        },
        {
            id: 'very_tired',
            conditions: { staminaBelow: 20 },
            template: "Your weary legs protest as you force yourself {direction}. Fatigue weighs on you like a heavy cloak. {brief_sensory}"
        },
        {
            id: 'light_breeze',
            conditions: { weather: 'light_wind' },
            template: "A gentle breeze accompanies you as you walk {direction}, carrying hints of distant places. {brief_sensory}"
        },
        {
            id: 'perfect_weather',
            conditions: { temperatureMin: 20, temperatureMax: 25, moistureMin: 40, moistureMax: 60 },
            template: "You stride {direction} with a spring in your step, the perfect weather lifting your spirits. {brief_sensory}"
        },
        {
            id: 'dense_fog',
            conditions: { weather: 'fog', lightMax: 30 },
            template: "Wisps of fog curl around you as you make your way {direction}, the world beyond arm's reach lost in the grey murk. {brief_sensory}"
        },
        {
            id: 'default',
            conditions: {},
            template: "You make your way {direction}, taking in the surroundings. {brief_sensory}"
        }
    ],
    vi: [
        {
            id: 'pitch_black',
            conditions: { lightMax: 5, requireNoLight: true },
            template: "Bạn từng bước dò dẫm qua bóng tối dày đặc về phía {direction}, đưa tay ra trước như một người mù tìm đường. Mỗi bước chân đều là một canh bạc trong màn đêm vô định. {brief_sensory}"
        },
        {
            id: 'night_no_light',
            conditions: { lightMax: 10, requireNoLight: true },
            template: "Bóng tối chập chờn nơi góc nhìn khi bạn cẩn thận di chuyển về phía {direction}, mỗi bước đi là một cuộc thương lượng với bóng đêm. {brief_sensory}"
        },
        {
            id: 'stormy_weather',
            conditions: { weather: 'storm' },
            template: "Tia chớp xé toạc bầu trời khi bạn chiến đấu với gió bão để tiến về phía {direction}. Cơn bão dữ dội khiến mỗi bước chân đều phải giữ thăng bằng. {brief_sensory}"
        },
        {
            id: 'heavy_rain',
            conditions: { weather: 'rain' },
            template: "Xuyên qua màn mưa dày đặc, bạn tiến về phía {direction}, quần áo nặng trĩu và ướt đẫm. Mưa dội xuống vai bạn không ngừng nghỉ. {brief_sensory}"
        },
        {
            id: 'deep_mud',
            conditions: { moistureMin: 90 },
            template: "Bùn đặc quánh tham lam níu kéo đôi giày khi bạn lội về phía {direction}. Mỗi bước đi là một chiến thắng nhỏ trước mặt đất nhão nhoét. {brief_sensory}"
        },
        {
            id: 'swamp_muddy',
            conditions: { moistureMin: 80 },
            template: "Nước đục ngầu bắn tung tóe quanh giày khi bạn cẩn thận bước về phía {direction}, thử từng bước trên nền đất không ổn định. {brief_sensory}"
        },
        {
            id: 'freezing_cold',
            conditions: { temperatureMax: 0 },
            template: "Cái lạnh thấu xương khi bạn tiến về phía {direction}. Hơi thở của bạn đông cứng lại trong không khí giá rét. {brief_sensory}"
        },
        {
            id: 'cold_bite',
            conditions: { temperatureMax: 10 },
            template: "Run rẩy trong cái lạnh, bạn tiến về phía {direction}. Cơ bắp đau nhức vì giá rét khi bạn co mình trong lớp áo. {brief_sensory}"
        },
        {
            id: 'scorching_heat',
            conditions: { temperatureMin: 40 },
            template: "Mặt trời thiêu đốt khi bạn lê bước về phía {direction}, không khí trước mặt vặn vẹo vì sức nóng. Mồ hôi chảy dọc sống lưng. {brief_sensory}"
        },
        {
            id: 'exhausted',
            conditions: { staminaBelow: 10 },
            template: "Thị giác mờ đi khi bạn loạng choạng về phía {direction}, mỗi bước đi đều là một nỗ lực phi thường. Thế giới như chao đảo theo sự kiệt sức của bạn. {brief_sensory}"
        },
        {
            id: 'very_tired',
            conditions: { staminaBelow: 20 },
            template: "Đôi chân mệt mỏi phản đối khi bạn cố gắng tiến về phía {direction}. Sự mệt nhọc đè nặng như một chiếc áo choàng. {brief_sensory}"
        },
        {
            id: 'light_breeze',
            conditions: { weather: 'light_wind' },
            template: "Làn gió nhẹ đồng hành cùng bạn khi bạn bước về phía {direction}, mang theo hương vị của những nơi xa xôi. {brief_sensory}"
        },
        {
            id: 'perfect_weather',
            conditions: { temperatureMin: 20, temperatureMax: 25, moistureMin: 40, moistureMax: 60 },
            template: "Bạn sải bước về phía {direction} với tinh thần phấn chấn, thời tiết tuyệt vời nâng cao tâm trạng. {brief_sensory}"
        },
        {
            id: 'dense_fog',
            conditions: { weather: 'fog', lightMax: 30 },
            template: "Sương mù cuộn quanh bạn khi bạn di chuyển về phía {direction}, thế giới ngoài tầm tay chìm trong màn sương xám xịt. {brief_sensory}"
        },
        {
            id: 'default',
            conditions: {},
            template: "Bạn tiến về phía {direction}, quan sát xung quanh. {brief_sensory}"
        }
    ]
};

export default movementTemplates;
