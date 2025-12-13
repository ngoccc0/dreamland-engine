

import type { BiomeTemplateData, Language, NarrativeLength } from '@/core/types/game';
import { validateBiomeTemplatesRecord } from '../schemas/narrativeSchema';

// This file holds structured narrative templates and keyword variations.

// A generic map type for our databases
type PlaceholderMap = {
  [key: string]: string[] | { [subKey: string]: string[] | string };
};

// --- HELPER FUNCTIONS ---

/**
 * Selects a random item from an array of strings.
 * @param arr The array of strings.
 * @returns A random string from the array, or an empty string if the array is empty.
 */
export function selectRandom(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Selects a descriptive phrase based on a numerical value and defined ranges.
 * @param map A map of level keys (e.g., 'high', 'medium', 'low') to arrays of phrases.
 * @param value The numerical value to check.
 * @param ranges A map defining the numerical ranges for each level key.
 * @returns A random phrase for the matching level, or an empty string.
 */
export function selectByRange(map: { [key: string]: string[] }, value: number | undefined, ranges: { [key: string]: [number, number] }): string {
  if (value === undefined) return '';
  for (const key in ranges) {
    if (value >= ranges[key][0] && value <= ranges[key][1]) {
      return selectRandom(map[key]);
    }
  }
  return '';
}


// --- KEYWORD VARIATION DATABASES ---
// These hold different ways to say the same thing.

const keyword_variations_vi: PlaceholderMap = {
  // CREATURE BEHAVIORS 
  creatureEating: ["{{creature}} gặm nhấm thảm thực vật", "{{creature}} đang kiếm ăn", "{{creature}} nhai nuốt lá cây"],
  creatureHungry: ["{{creature}} có vẻ đang đói", "{{creature}} tìm kiếm thức ăn quanh đây", "{{creature}} ngó nghiêng tìm thức ải"],

  // DANGER & THREATS
  danger_feeling_high: ["nguy hiểm rình rập", "bất an sâu sắc", "rờn rợn đến sống lưng"],
  danger_source: ["một hiểm họa khôn lường", "những ánh mắt không mời", "một thế lực thù địch"],
  danger_feeling_moderate: ["căng thẳng", "cảnh giác cao độ", "bất ổn"],
  explorability_adj_low: ["dày đặc", "chằng chịt", "khó lường"],
  movement_difficulty_adj: ["khó khăn", "chậm chạp", "gian nan"],
  explorability_adj_moderate: ["thử thách", "đòi hỏi sự khéo léo", "cần sự tập trung"],
  magic_aura_high: ["rung động mãnh liệt với phép thuật", "như một cơn bão ma thuật", "tràn ngập năng lượng huyền bí"],
  magic_effect_sense: ["rung lên", "nhạy bén lạ thường", "ù đi vì năng lượng"],
  magic_aura_moderate: ["ma mị", "kỳ ảo", "phảng phất"],
  human_presence_sign: ["nghe thấy tiếng vọng của sự sống con người", "thấy những dấu vết nhạt nhòa của văn minh", "có cảm giác ai đó đã đi qua đây"],
  human_presence_faint: ["cũ kỹ", "lờ mờ", "gần như đã bị xóa sổ"],
  predator_feeling_high: ["kinh hoàng", "buốt sống lưng", "như bị săn đuổi"],
  predator_eyes_adj: ["đỏ ngầu", "sắc lạnh", "đầy tham vọng"],
  predator_sounds: ["gầm gừ", "xào xạc đáng ngại", "khẽ khàng chết chóc"],
  conclusion_danger: ["Một cảm giác lo lắng len lỏi trong từng thớ thịt bạn. Bạn nên cẩn trọng.", "Bản năng mách bảo bạn rằng nơi này không an toàn. Mọi quyết định đều phải được cân nhắc."],
  conclusion_confusing: ["Mọi thứ chìm trong một sự hỗn loạn và khó hiểu, gần như không thể tiến xa hơn.", "Nơi này như một mê cung, khiến bạn mất phương hướng."],
  conclusion_neutral: ["Bạn đứng đó, sẵn sàng cho những gì tiếp theo.", "Bạn hít một hơi thật sâu, chuẩn bị tinh thần cho thử thách phía trước."],
  temp_adj: { hot: ["nóng bỏng", "oi ả", "ngột ngạt"], mild: ["dịu mát", "ấm áp"], cold: ["se lạnh", "giá buốt"] },
  moisture_adj: { high: ["đặc quánh", "như súp", "ẩm ướt"], medium: ["trong lành", "thoáng đãng"], low: ["khô hanh"] },
  light_adj: { dark: ["mờ ảo", "leo lét", "chập choạng"], medium: ["lấp lánh", "le lói"], bright: ["chói chang", "rực rỡ"] },
  // Monologue / short player self-talk lines (VI)
  monologue_hunger_1: ["Bụng mình sôi lên rồi. Phải kiếm gì bỏ bụng thôi.", "Đói quá... Giờ mà có gì ăn thì tuyệt.", "Lần cuối mình ăn là khi nào nhỉ? Chẳng nhớ nổi nữa."],
  monologue_hunger_2: ["Cơn đói đang cào xé ruột gan. Mình cần tìm chút gì đó để lấp đầy khoảng trống này.", "Dạ dày bắt đầu biểu tình rồi. Một chút thức ăn lúc này chẳng khác nào ân huệ.", "Ký ức về bữa ăn cuối cùng đã nhạt nhòa... Mình đã nhịn bao lâu rồi?"],
  monologue_health_1: ["Vết thương đau quá. Mình cần nghỉ ngơi một chút.", "Hú hồn! Suýt chết. Lần sau phải cẩn thận hơn mới được.", "Bị thương nặng hơn mình tưởng rồi. Phải tìm chỗ trốn thôi."],
  monologue_health_2: ["Vết thương đang nhức nhối theo từng nhịp thở. Cơ thể này cần được ngơi nghỉ để hàn gắn.", "Lưỡi hái tử thần vừa lướt qua sát sạt... Mình không được phép lơ là thêm một giây nào nữa.", "Máu chảy nhiều hơn mình nghĩ. Phải tìm nơi trú ẩn trước khi sức tàn lực kiệt."],
  monologue_exploration_1: ["Cái gì đằng kia thế nhỉ? Lại xem thử xem.", "Chỗ này thú vị thật... Không biết có gì ở đây?", "Cảm giác cứ muốn đi sâu vào trong nữa."],
  monologue_exploration_2: ["Thứ kia... nó đang vẫy gọi sự tò mò của mình. Phải đến gần hơn để giải mã nó.", "Nơi này ẩn chứa những bí mật kỳ lạ... Liệu thứ gì đang chờ đợi mình phía trước?", "Có một lực hút vô hình thôi thúc mình dấn sâu hơn vào bóng tối này."],
  monologue_danger_1: ["Hình như có tiếng động? Phải coi chừng.", "Mình không ở đây một mình... Có cảm giác rất lạ.", "Hình như có ai đang nhìn mình. Tỉnh táo lên nào."],
  monologue_danger_2: ["Tiếng động gì vậy? Không gian này... không an toàn. Phải cảnh giác cao độ.", "Sống lưng lạnh toát... Mình không đơn độc. Có kẻ nào đó đang lẩn khuất quanh đây.", "Những ánh mắt vô hình đang dán chặt vào mình từ bóng tối. Không được lơi lỏng."],
  monologue_achievement_1: ["Ngon lành hơn mình nghĩ!", "Làm được rồi! Cũng đâu tệ lắm.", "Thắng rồi! Giờ làm gì tiếp đây?"],
  monologue_achievement_2: ["Mọi thứ suôn sẻ ngoài mong đợi. May mắn đã mỉm cười.", "Xong! Thử thách này không thể đánh gục được mình.", "Chiến thắng đã nằm trong tay. Nhưng... bước tiếp theo là gì?"],
  monologue_location_sacred: ["Không khí nơi này... thật thiêng liêng. Tựa như các vị thần vẫn đang dõi theo."],
  monologue_location_ominous: ["Nơi này toát lên vẻ u ám rợn người. Từng thớ thịt mình đang run lên."],
  monologue_location_beautiful: ["Vẻ đẹp đến nghẹt thở... Ước gì thời gian ngừng trôi để mình đắm chìm ở đây mãi mãi."],
  monologue_time_1: ["Hình như mình đi được một lúc lâu rồi.", "Bóng nắng đã ngả dài... Hoàng hôn đang dần buông xuống.", "Không biết còn bao lâu nữa bóng đêm sẽ nuốt chửng nơi này?"],
  monologue_time_2: ["Đôi chân đã mỏi... Mình đã lang thang bao lâu trên con đường này rồi?"],
  monologue_crafting_1: ["Cái này chắc dùng chế đồ được đấy.", "Thứ này quá chuẩn cho kế hoạch của mình."],
  monologue_crafting_2: ["Mảnh này... có tiềm năng. Mình có thể tái tạo nó thành thứ hữu dụng.", "Mảnh ghép hoàn hảo cho những gì mình đang toan tính."],
  monologue_self_doubt_1: ["Liệu con đường này có đúng không? Đôi khi... niềm tin trong mình lung lay dữ dội.", "Ca này khó nhằn hơn mình tưởng."],
  monologue_self_doubt_2: ["Thử thách này khắc nghiệt hơn mọi dự tính ban đầu."],
  monologue_weather_rain: ["Mưa ngày càng nặng hạt. Phải tìm chỗ trú trước khi ướt sũng."],
  monologue_weather_snow: ["Cái lạnh thấu xương đang ngấm vào da thịt. Phải di chuyển, đứng lại là chết."],
  // Biome-flavored random lines (VI)
  jungle_monologue: ["Độ ẩm làm tôi mệt mỏi.", "Cái nóng khiến mỗi bước nặng nề hơn.", "Hơi thở trở nên gấp gáp và dính.", "Nên tìm bóng mát sớm thôi."],
  forest_monologue: ["Sự yên ắng dễ chịu, nhưng tôi bắt đầu mệt.", "Chân tôi đau sau quãng đường này.", "Nghỉ dưới gốc cây có lẽ sẽ giúp.", "Tôi cần một lát để lấy lại sức."],
  // Continuation/linking lines for repeated movement inside same biome (VI)
  jungle_continuation: ["Bạn tiếp tục lần mò trong khu rừng này; lần này không có gì khác lạ.", "Bạn vẫn tiến sâu trong rừng, lần này mọi thứ im ắng hơn.", "Bạn tiếp tục bước qua những tán lá; mọi thứ vẫn không thay đổi."],
  forest_continuation: ["Bạn tiếp tục len qua khu rừng; lần này có vài tiếng động xa xa.", "Bạn tiếp tục con đường trong rừng này, thấy vài chiếc lá chuyển động nhẹ.", "Bạn tiếp tục bước đi, cảnh vật vẫn giữ vẻ yên ắng."],
  beach_continuation: ["Bạn dạo dọc theo bờ, lần này sóng nhẹ và không gì mới.", "Bạn tiếp tục đi trên bãi cát; mùi biển vẫn đồng đều.", "Bạn bước tiếp dọc bờ, những vệt cát kéo dài trước mắt."],
  desert_continuation: ["Bạn tiếp tục tiến trên sa mạc; cát trải dài vô tận.", "Bạn bước qua cồn cát lần nữa, không có dấu hiệu thay đổi.", "Bạn vẫn tiếp tục đi giữa cái nắng khô cằn."],
  swamp_continuation: ["Bạn tiếp tục mò qua đầm lầy; bùn vẫn nhão dưới chân.", "Bạn bước tiếp, tiếng vo ve không dứt.", "Bạn vẫn di chuyển giữa lớp sương mỏng của đầm lầy."],
  mountain_continuation: ["Bạn tiếp tục leo lên sườn núi, hơi thở vẫn gấp.", "Bạn tiếp tục vượt qua những mỏm đá, không thấy dấu hiệu khác.", "Bạn tiếp tục bước lên đỉnh cao, cảm giác mệt mỏi theo từng bước."],
  tundra_continuation: ["Bạn tiếp tục băng qua đồng băng, gió lạnh không thay đổi.", "Bạn tiếp tục bước trên băng giá; cảnh vật trắng xoá.", "Bạn vẫn đi trong cái lạnh, không có gì khác lạ."],
  cave_continuation: ["Bạn tiếp tục dò dẫm trong hang; tiếng giọt nước vẫn văng vảng.", "Bạn bước thêm chút nữa trong bóng tối, cảm giác yên tĩnh vẫn vậy.", "Bạn vẫn len lỏi qua những hành lang đá, im lặng xung quanh."],
  // Additional biome monologue pools (VI)
  beach_monologue: ["Không khí mặn khiến tôi mệt.", "Tiếng sóng êm nhưng tôi mệt dần.", "Cát làm chân tôi nặng nề.", "Nên trú bóng mát một lát."],
  desert_monologue: ["Cái nóng rút cạn sức lực.", "Mặt trời thiêu đốt không ngừng.", "Nước có vẻ xa vời.", "Nên giữ sức và tìm bóng râm."],
  swamp_monologue: ["Bùn đất níu chân tôi.", "Không khí nặng nề làm mệt.", "Mỗi bước nặng nề hơn.", "Cần đi chậm và nghỉ ngơi."],
  mountain_monologue: ["Không khí loãng khiến tôi khó thở.", "Mỗi bước là một cuộc đấu; cần nghỉ.", "Leo núi làm chân tôi mỏi.", "Nên dừng lại lấy lại sức."],
  tundra_monologue: ["Cái lạnh cắn sâu vào xương.", "Hơi thở đóng băng, tay chân nặng nề.", "Cần sưởi ấm sớm.", "Cái lạnh khiến bước chân nặng nề."],
  cave_monologue: ["Độ ẩm trong hang làm tôi mệt.", "Bóng tối hút đi năng lượng của tôi.", "Nên tìm chỗ ấm.", "Sự im lặng làm tôi cạn kiệt sức lực."],
  grassland_monologue: ["Cái nóng từ mặt trời làm tôi mệt.", "Đồng cỏ rộng lớn khiến tôi cảm thấy nhỏ bé.", "Gió nhẹ giúp tôi tỉnh táo.", "Nên tìm bóng mát nghỉ ngơi."],
  grassland_continuation: ["Bạn tiếp tục bước qua đồng cỏ; lần này gió nhẹ hơn.", "Bạn vẫn đi giữa những ngọn cỏ cao, cảnh vật không thay đổi.", "Bạn tiếp tục băng qua cánh đồng xanh mướt."],
};

const keyword_variations_en: PlaceholderMap = {
  // CREATURE BEHAVIORS
  creatureEating: ["{{creature}} nibbles at the vegetation", "{{creature}} is foraging", "{{creature}} chews on leaves"],
  creatureHungry: ["{{creature}} seems hungry", "{{creature}} searches for food", "{{creature}} looks around for sustenance"],

  // DANGER & THREATS
  danger_feeling_high: ["imminent danger", "deep unease", "a chill down your spine"],
  danger_source: ["an unseen threat", "unwelcome eyes", "a hostile force"],
  danger_feeling_moderate: ["tension", "high alert", "instability"],
  explorability_adj_low: ["dense", "impenetrable", "treacherous"],
  movement_difficulty_adj: ["difficult", "slow", "arduous"],
  explorability_adj_moderate: ["challenging", "requiring finesse", "demanding focus"],
  magic_aura_high: ["vibrates intensely with magic", "like a magical storm", "overflows with arcane energy"],
  magic_effect_sense: ["tingle", "become unusually sharp", "buzz with power"],
  magic_aura_moderate: ["eerie", "fantastical", "faint"],
  human_presence_sign: ["you hear an echo of civilization", "you see faint traces of past visitors", "you feel that someone has passed through here"],
  human_presence_faint: ["old", "faded", "almost erased"],
  predator_feeling_high: ["terror", "a spine-chilling sensation", "the feeling of being hunted"],
  predator_eyes_adj: ["glowing red", "ice-cold", "full of ambition"],
  predator_sounds: ["growls", "ominous rustling", "deadly silence"],
  conclusion_danger: ["A sense of anxiety creeps into your every fiber. You should be cautious.", "Your instincts tell you this place isn't safe. Every decision must be weighed carefully."],
  conclusion_confusing: ["Everything is shrouded in chaos and confusion, making it nearly impossible to proceed.", "This place is like a maze, leaving you disoriented."],
  conclusion_neutral: ["You stand there, ready for what comes next.", "You take a deep breath, preparing yourself for the challenges ahead."],
  temp_adj: { hot: ["scorching", "sweltering", "oppressive"], mild: ["mild", "warm"], cold: ["chilly", "freezing"] },
  moisture_adj: { high: ["soupy", "cloying", "damp"], medium: ["fresh", "pleasant"], low: ["dry"] },
  light_adj: { dark: ["dim", "flickering", "eerie"], medium: ["dappled", "mottled"], bright: ["blazing", "vivid"] },
  // Monologue / short player self-talk lines (EN)
  monologue_hunger_1: ["My stomach growls. I should look for something to eat.", "I'm getting hungry. Food would be good about now.", "When was the last time I ate? I can't remember."],
  monologue_hunger_2: ["The pangs of hunger are gnawing at my insides. I need to find something to fill this void.", "My stomach is staging a protest. Some food right now would be a godsend.", "The memory of my last meal has faded... How long have I been without sustenance?"],
  monologue_health_1: ["My wounds ache. I need to rest and heal.", "That was a close call. I should be more careful.", "I'm hurt worse than I thought. Better find shelter."],
  monologue_health_2: ["My wounds throb with each breath. My body needs rest to recover.", "The reaper's scythe just brushed past me... I can't afford to be careless another moment.", "I'm bleeding more than expected. I need to find shelter before I collapse."],
  monologue_exploration_1: ["What's that? I should investigate.", "This place is interesting... I wonder what's here?", "I feel drawn to explore further."],
  monologue_exploration_2: ["That thing... it's calling to my curiosity. I need to get closer and understand it.", "This place holds strange secrets... What could be waiting for me ahead?", "There's an invisible force pulling me deeper into this darkness."],
  monologue_danger_1: ["Did I hear something? Better be careful.", "I'm not alone here... Something feels off.", "Something's watching me. I need to stay alert."],
  monologue_danger_2: ["What was that sound? This place... it's not safe. I need to be on high guard.", "My skin crawls... I'm not alone. Something is lurking nearby.", "Unseen eyes are fixed on me from the shadows. I can't let my guard down."],
  monologue_achievement_1: ["That went better than expected!", "I did it! That wasn't so bad.", "Victory! Now what?"],
  monologue_achievement_2: ["Everything went smoothly beyond my hopes. Fortune smiled upon me.", "Done! This challenge couldn't defeat me.", "Victory is in my grasp. But... what's next?"],
  monologue_location_sacred: ["There's something sacred about this place. It feels as though the gods themselves are watching."],
  monologue_location_ominous: ["This place emanates an eerie, chilling aura. Every fiber of my being trembles."],
  monologue_location_beautiful: ["This beauty is breathtaking... I wish time would stop so I could remain lost in this place forever."],
  monologue_time_1: ["It seems I've been traveling for quite a while now.", "The sun's shadows have grown long... Dusk is slowly descending.", "I wonder how much longer until the darkness engulfs this place?"],
  monologue_time_2: ["My legs are weary... How long have I been wandering on this path?"],
  monologue_crafting_1: ["This might be useful for crafting.", "This will work perfectly for what I'm planning."],
  monologue_crafting_2: ["This piece... has potential. I can reshape it into something useful.", "A perfect piece for what I'm scheming."],
  monologue_self_doubt_1: ["Is this path the right one? Sometimes... my conviction wavers greatly.", "This is harder than I thought."],
  monologue_self_doubt_2: ["This challenge is more severe than my initial expectations."],
  monologue_weather_rain: ["This rain is getting heavier. I should find shelter before I'm soaked."],
  monologue_weather_snow: ["The cold penetrates to my bones. I must keep moving; stopping is death."],
  // Biome-flavored random lines (EN)
  jungle_monologue: ["The humidity is wearing me down.", "This heat makes every step feel heavier.", "My breath comes in short, sticky gasps.", "I should find some shade soon."],
  forest_monologue: ["The quiet is soothing, but I'm getting tired.", "My legs ache from all this walking.", "A short rest beneath that tree would help.", "I could use a moment to gather my strength."],
  // Continuation/linking lines for repeated movement inside same biome (EN)
  jungle_continuation: ["You continue to push through the jungle; this time, nothing seems different.", "You press on through the undergrowth, and it feels quieter this time.", "You move deeper among the leaves; the scene remains unchanged."],
  forest_continuation: ["You continue along the forest path; this time you hear a distant rustle.", "You press on through the trees, noticing a few leaves stir.", "You keep moving; the forest remains hushed."],
  beach_continuation: ["You stroll along the shore; the waves are calm and nothing new appears.", "You continue across the sand; the salt air is steady.", "You walk on the beach, the horizon unchanged."],
  desert_continuation: ["You continue across the dunes; sand rolls on inexorably.", "You trudge through the desert again; there is no sign of change.", "You press forward beneath the relentless sun."],
  swamp_continuation: ["You continue through the swamp; the mud clings to your boots.", "You push on, the buzzing never stops.", "You move ahead among the murky water, nothing new emerges."],
  mountain_continuation: ["You continue up the mountain path; your breath still comes short.", "You pick your way over rocks again, no obvious change.", "You climb on, each step wearing at your legs."],
  tundra_continuation: ["You continue across the tundra; the wind and whiteness persist.", "You keep walking on the frozen plain, the landscape unchanged.", "You trudge onward through the cold; nothing seems different."],
  cave_continuation: ["You continue to grope through the cave; dripping water echoes as before.", "You move further into the dark tunnel; the silence holds.", "You press on through the caverns, the passage unchanged."]
  , // Additional biome monologue pools (EN)
  beach_monologue: ["The salt air is tiring me.", "The waves lull me but my energy fades.", "Sand between my toes weighs on me.", "I should rest away from the sun."],
  desert_monologue: ["The heat saps my strength.", "The sun beats down relentlessly.", "My water feels too far away.", "I should conserve my energy."],
  swamp_monologue: ["This muck drags at my feet.", "The air is thick and exhausting.", "Every step feels heavier here.", "I should move carefully and rest."],
  mountain_monologue: ["Thin air makes me breathless.", "Each step is a fight; I need rest.", "The climb wears on my legs.", "I should pause and regroup."],
  tundra_monologue: ["The cold gnaws at my bones.", "My breath fogs and my limbs slow.", "I need to warm up soon.", "This cold makes every step harder."],
  cave_monologue: ["The damp chill saps my strength.", "This darkness eats at my energy.", "I should find a warm spot.", "I feel drained by the silence."],
  grassland_monologue: ["The sun's heat is wearing me down.", "This vast grassland makes me feel small.", "The gentle breeze keeps me alert.", "I should find some shade to rest."],
  grassland_continuation: ["You continue across the grassland; this time the wind is gentler.", "You keep walking through the tall grass, the scenery unchanged.", "You press on through the lush green field."],
};


// --- EXPORTED BIOME TEMPLATES ---

export const biomeNarrativeTemplates: Record<string, BiomeTemplateData> = {
  "Jungle": {
    terrain: "Jungle",
    emoji: { type: 'image', url: '/asset/images/jungle.png' },
    descriptionTemplates: [
      {
        id: "jungle_opening_gloomy",
        type: "Opening",
        mood: ["Foreboding", "Gloomy"],
        length: "long",
        conditions: { "lightLevel": { "max": 0 } },
        weight: 0.7,
        template: "Một bức màn {{adjective_dark}} bao trùm {{jungle_terrain_desc}}. Ánh sáng {{light_level_detail}} chỉ đủ để nhận ra những hình thù {{vague_shape_adj}} mờ ảo, như thể khu rừng đang {{jungle_feeling_dark}}."
      },
      {
        id: "jungle_opening_lush",
        type: "Opening",
        mood: ["Peaceful", "Lush"],
        length: "medium",
        conditions: { "lightLevel": { "min": 5 }, "moisture": { "min": 5 } },
        weight: 0.5,
        template: "Bạn đang len lỏi giữa {{jungle_terrain_desc_lush}}. Không khí {{temp_detail}} và {{moisture_detail}} bao trùm, mang theo {{smell_detail_lush}}."
      },
      {
        id: "entity_report_danger",
        type: "EntityReport",
        mood: ["Danger"],
        length: "medium",
        conditions: { "predatorPresence": { "min": 5 } },
        weight: 1.0,
        template: "Đột nhiên, bạn cảm nhận được {sensory_detail_danger}. {entity_report_detail}!"
      },
      {
        id: "sensory_detail_gloomy",
        type: "SensoryDetail",
        mood: ["Gloomy", "Dark"],
        length: "long",
        conditions: { "lightLevel": { "max": 0 } },
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
      // Added missing keys referenced by templates
      "jungle_feeling_dark": ["đang theo dõi bạn", "như thể ai đó đang quan sát bạn"],
      "feeling_gloomy": ["bất an sâu sắc", "rờn rợn đến sống lưng"],
      // temperature/moisture detail placeholders used by some templates
      "temp_detail_gloomy": ["trong cái lạnh buốt", "se lạnh khẽ"],
      "moisture_detail_gloomy": ["trong không khí ẩm ướt nặng nề", "ẩm mốc, nặng nề"],
      "temp_detail": ["trong thời tiết dễ chịu", "trong hơi ấm nhẹ"],
      "moisture_detail": ["trong không khí ẩm ướt", "trong không khí khô ráo"],
      // Compatibility keys expected by tests/templates
      "jungle_adjective_lush": ["rậm rạp", "xanh tươi"],
      "jungle_adjective_mysterious": ["bí ẩn", "huyền bí"],
    },
    features: {
      "main_feature": ["một dòng suối nhỏ", "một cụm cây cổ thụ", "một vách đá phủ rêu"],
    },
    smells: {
      "smell_dark": ["mùi ẩm mốc", "mùi đất mục", "mùi nồng của lá chết"],
      "smell_lush": ["mùi hoa dại", "mùi đất ẩm tươi", "hương vị của sự sống"],
      // Added detail-level smell used by templates
      "smell_detail_lush": ["mùi hoa dại thoang thoảng", "mùi đất ẩm tươi nồng nàn"],
    },
    sounds: {
      "sound_dark": ["tiếng côn trùng rỉ rả", "tiếng gió rít qua kẽ lá", "âm thanh ghê rợn"],
      "sound_lush": ["tiếng chim hót líu lo", "tiếng nước chảy róc rách", "tiếng lá xào xạc"],
    },
    sky: {
      "sky_general": ["bầu trời u ám", "những vệt sáng hiếm hoi", "tán lá che khuất bầu trời"],
    }
  },

  "forest": {
    terrain: "forest",
    descriptionTemplates: [
      { id: "forest_1", type: "Opening", mood: ["Peaceful", "Lush"], length: "medium", weight: 1, template: "Bạn đang ở trong một khu rừng {{adjective_lush}} với những cây {{feature_tree}} vươn cao, che khuất bầu trời {{sky_general}}. Không khí có mùi {{smell_lush}}." },
      { id: "forest_2", type: "Opening", mood: ["Gloomy", "Mysterious"], length: "long", weight: 0.8, template: "Bạn đang ở sâu trong một khu rừng {{adjective_dark}}. Ánh sáng yếu ớt xuyên qua kẽ lá, và bạn nghe thấy tiếng {{sound_dark}} của sự sống hoang dã. {sensory_details} {entity_report} {surrounding_peek}" },
    ],
    adjectives: {
      "adjective_lush": ["rậm rạp", "yên tĩnh", "xanh tươi"],
      "adjective_dark": ["u ám", "ma mị", "cổ xưa"],
      "feature_tree": ["sồi", "thông", "dương xỉ"],
      "sky_general": ["xanh biếc", "vàng úa", "xám xịt"],
    },
    features: {},
    smells: {
      "smell_lush": ["đất ẩm", "lá cây mục", "nhựa thông"],
    },
    sounds: {
      "sound_dark": ["cành cây gãy", "sự im lặng đáng sợ", "tiếng côn trùng kêu"],
    },
    sky: {}
  },
  "grassland": {
    terrain: "grassland",
    emoji: { type: 'image', url: '/asset/images/grass_field.png' },
    descriptionTemplates: [
      {
        id: "grassland_opening_vast",
        type: "Opening",
        mood: ["Peaceful", "Vast"],
        length: "medium",
        conditions: { "lightLevel": { "min": 5 } },
        weight: 0.8,
        template: "{{narrative.grassland_opening_vast}}"
      },
      {
        id: "grassland_opening_windy",
        type: "Opening",
        mood: ["Peaceful", "Vast"],
        length: "long",
        conditions: { "lightLevel": { "min": 5 } },
        weight: 0.7,
        template: "{{narrative.grassland_opening_windy}}"
      },
      {
        id: "grassland_sensory_detail_calm",
        type: "SensoryDetail",
        mood: ["Peaceful", "Serene"],
        length: "medium",
        conditions: { "dangerLevel": { "max": 2 } },
        weight: 0.9,
        template: "Tiếng {{sound_calm}} hòa cùng tiếng gió vi vu, mang theo mùi {{smell_calm}}. Ánh nắng {{light_adj}} chiếu xuống, làm nổi bật vẻ đẹp tự nhiên của đồng cỏ."
      },
      {
        id: "grassland_entity_report_wildlife",
        type: "EntityReport",
        mood: ["Peaceful"],
        length: "short",
        conditions: { "humanPresence": { "max": 1 }, "predatorPresence": { "max": 2 } },
        weight: 0.6,
        template: "Xa xa, bạn thấy {{wildlife_detail}} đang {{wildlife_action}}, tạo nên một khung cảnh bình yên và sống động."
      },
      {
        id: "grassland_closing_reflective",
        type: "Closing",
        mood: ["Peaceful", "Serene"],
        length: "medium",
        conditions: {},
        weight: 0.7,
        template: "Một cảm giác {{feeling_closing}} bao trùm lấy bạn khi bạn ngắm nhìn khung cảnh {{adjective_reflective}} này. Đồng cỏ như một tấm thảm xanh trải dài, mời gọi bạn khám phá thêm."
      }
    ],
    adjectives: {
      "adjective_vast": ["bao la", "rộng lớn", "trải dài"],
      "adjective_windy": ["lộng gió", "thoáng đãng", "tự do"],
      "adjective_reflective": ["rộng lớn", "yên bình", "tự nhiên"],
      "grass_adj": ["xanh mướt", "cao vút", "đung đưa"],
      "wind_adj": ["nhẹ nhàng", "mạnh mẽ", "liều trai"],
      "light_adj": ["vàng ấm", "trắng dịu", "rực rỡ"],
      "temp_detail": ["trong thời tiết dễ chịu", "trong hơi ấm nhẹ"],
      "moisture_detail": ["trong không khí khô ráo", "trong không khí trong lành"]
    },
    features: {
      "grassland_feature": ["cánh đồng xanh mướt", "những ngọn cỏ cao", "không gian rộng mở"],
      "wildlife_detail": ["một đàn động vật ăn cỏ", "những chú chim bay lượn", "một con thú nhỏ đang lẩn khuất"],
      "wildlife_action": ["thong thả gặm cỏ", "bay lượn trên bầu trời", "chạy nhảy vui vẻ"]
    },
    smells: {
      "smell_vast": ["mùi cỏ tươi mát", "mùi đất ẩm sau mưa", "hương hoa dại thoang thoảng"],
      "smell_calm": ["cỏ khô và đất ẩm", "hoa dại nở rộ", "không khí trong lành"]
    },
    sounds: {
      "sound_calm": ["côn trùng rỉ rả", "chim hót líu lo", "gió xào xạc qua cỏ"]
    },
    sky: {
      "sky_vast": ["xanh ngắt", "rộng mở", "trong trẻo"],
      "feeling_windy": ["sự tự do", "năng lượng dồi dào", "sự sống động"],
      "feeling_closing": ["bình yên và tự do", "yên tĩnh sâu sắc", "hòa hợp với thiên nhiên"]
    }
  },
  "beach": { terrain: "beach", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "desert": { terrain: "desert", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "swamp": { terrain: "swamp", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mesa": { terrain: "mesa", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "tundra": { terrain: "tundra", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mountain": { terrain: "mountain", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "cave": { terrain: "cave", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "volcanic": { terrain: "volcanic", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "floptropica": { terrain: "floptropica", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "wall": { terrain: "wall", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "ocean": { terrain: "ocean", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "city": { terrain: "city", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "space_station": { terrain: "space_station", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "underwater": { terrain: "underwater", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mushroom_forest": { terrain: "mushroom_forest", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
};

// Validate the biome templates at module load time
validateBiomeTemplatesRecord(biomeNarrativeTemplates);


// --- EXPORT FUNCTIONS ---

export function getKeywordVariations(language: Language) {
  return language === 'vi' ? keyword_variations_vi : keyword_variations_en;
}

/**
 * Finds a template string from the database.
 * @param language The current language ('vi' or 'en').
 * @param category The main category (e.g., 'description_templates').
 * @param topic The specific topic (e.g., 'jungle_general').
 * @param level The desired detail level ('short', 'medium', 'detailed').
 * @returns An array of template strings.
 */
export function findTemplate(language: Language, category: string, topic: string, level: NarrativeLength): string[] {
  const db: Record<string, any> = language === 'vi' ? keyword_variations_vi : keyword_variations_en;

  const categoryObj = (db as any)[category];
  if (!categoryObj) return [];

  const topicObj = categoryObj[topic];
  if (!topicObj) return [];

  // Fallback logic: if 'detailed' is requested but doesn't exist, try 'medium', then 'short'.
  let templates = topicObj[level];
  if (!templates || templates.length === 0) {
    templates = topicObj.medium;
  }
  if (!templates || templates.length === 0) {
    templates = topicObj.short;
  }

  return templates || [];
}
