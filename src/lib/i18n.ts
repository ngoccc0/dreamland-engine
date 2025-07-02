
export const translations = {
  en: {
    gameTitle: "Dreamland Engine",
    // Language Selector
    selectLanguage: "Select Language",
    
    // World Setup
    worldSetupTitle: "Create Your World",
    worldSetupStep1: "Step 1: Describe your idea. It can be short or detailed.",
    worldSetupPlaceholder: "e.g., 'A lone lighthouse on a stormy coast, haunted by a ghost.'",
    suggestKeywords: "Suggest Keywords",
    suggesting: "Suggesting...",
    tryTheseIdeas: "Or try one of these ideas:",
    generateWorlds: "Generate World Versions",
    
    worldSetupStep2: "Step 2: The AI has created 3 versions. Use the < > buttons to view and select the elements you like best!",
    mixAndMatchTitle: "Select and Mix",
    generatingUniverses: "Forging universes... Please wait!",
    worldName: "World Name",
    openingNarrative: "Opening Narrative",
    startingBiome: "Starting Biome",
    startingSkill: "Starting Skill",
    startingEquipment: "Starting Equipment",
    itemsFromChoice: "Items from Choice {index}",
    firstQuest: "First Quest",
    questFromChoice: "Quest from Choice {index}",
    yourWorld: "Your World:",
    yourWorldDescription: "This is the world created from your choices.",
    backAndEdit: "← Back & Edit",
    startAdventure: "Start Adventure →",

    // Toasts
    error: "Error",
    suggestionError: "Could not generate suggestions at this time.",
    noIdeaError: "No idea yet!",
    noIdeaErrorDesc: "Please describe the world you want to create.",
    worldGenError: "World Creation Error",
    worldGenErrorDesc: "Cosmic energies are disturbed. Please try again.",
    offlineModeActive: "Offline Mode Active",
    offlineToastDesc: "Don't worry, you can continue your journey without an internet connection, but having one provides the best experience.",
    notEnoughIngredients: "Not enough ingredients.",
    notEnoughStamina: "Not Enough Stamina!",
    notEnoughStaminaDesc: "Building requires {cost} stamina, but you only have {current}.",
    craftSuccessTitle: "Crafting Successful!",
    craftSuccess: "You successfully crafted: {itemName}",
    craftFailTitle: "Crafting Failed!",
    craftFail: "Your attempt to craft {itemName} failed, and the ingredients were lost.",
    newRecipeIdea: "New Recipe Idea!",

    // Game Layout
    wentDirection: "You go {direction}.",
    directionNorth: "north",
    directionSouth: "south",
    directionEast: "east",
    directionWest: "west",
    observeEnemy: "You observe the {npc}. It looks ferocious!",
    talkToNpc: "You talk to {npc}. They tell you about a nearby treasure.",
    questUpdated: "Quest updated.",
    exploreArea: "You explore the area and find a strange track.",
    pickupItem: "You picked up {item}!",
    attackEnemy: "You attack the {enemyType}, dealing {playerDamage} damage.",
    enemyDefeated: "You have defeated the {enemyType}!",
    enemyHpLeft: "The {enemyType} has {hp} HP left.",
    enemyRetaliates: "The {enemyType} retaliates, you lose {enemyDamage} HP.",
    youFell: "You have fallen!",
    customActionResponses: {
      checkTree: "You check the tree and find an apple!",
      noTree: "There is only sand or grass here!",
      dig: "You dig in the sand and find a coin!",
      groundTooHard: "The ground is too hard or grassy to dig!",
      reapGrass: "You reap the grass, obtaining some hay!",
      noGrass: "There is no grass to reap here!",
      lookAround: "You look around and see a faint path.",
      actionFailed: "Action not recognized. Try again!",
    },
    status: "Status",
    statusTooltip: "View health, mana, and quests.",
    inventory: "Inventory",
    inventoryTooltip: "Check the items you are carrying.",
    crafting: "Crafting",
    craftingTooltip: "Open the crafting window.",
    building: "Building",
    buildingTooltip: "Open the building window. Building costs stamina and time.",
    availableActions: "Available Actions",
    customActionPlaceholder: "Custom action...",
    submit: "Submit",
    submitTooltip: "Submit your custom action.",
    aiStoryteller: "AI Storyteller",
    aiStorytellerDesc: "Enable to have an AI generate dynamic narratives. Disable for a classic, rule-based experience (works offline).",
    skills: "Skills",
    manaCost: "Mana Cost",
    structureActions: "Structure Actions",
    rest: "Rest",
    restTooltip: "Rest at {shelterName} to recover {hp} HP and {stamina} Stamina.",
    restInShelter: "You rest in the {shelterName}...",
    restSuccess: "You recovered {restoration}.",
    restSuccessTemp: "Your body temperature returns to a comfortable level.",
    restNoEffect: "You are already fully recovered.",


    // Controls
    moveAndAttack: "Move & Attack",
    moveUp: "Up",
    moveLeft: "Left",
    moveRight: "Right",
    moveDown: "Down",
    moveNorthTooltip: "Move North",
    moveWestTooltip: "Move West",
    attackTooltip: "Attack",
    moveEastTooltip: "Move East",
    moveSouthTooltip: "Move South",

    // Status Popup
    playerStatus: "Player Status",
    playerStatusDesc: "Your current condition and active quests.",
    health: "Health: {hp}/100",
    mana: "Mana: {mana}/50",
    stamina: "Stamina: {stamina}/100",
    bodyTemperature: "Body Temperature: {temp}°C",
    bodyTempDesc: "Your body tries to maintain 37°C. Extreme temperatures will affect your stamina and health.",
    tempDangerFreezing: "You are freezing! Your health is dropping.",
    tempWarningCold: "You're starting to feel cold. Your movements are sluggish.",
    tempWarningHot: "The heat is making you feel sluggish. Your stamina is draining.",
    tempDangerHot: "You are overheating! Your stamina is draining rapidly.",
    companions: "Companions",
    noCompanions: "No companions yet.",
    quests: "Quests",
    noQuests: "No active quests.",
    combatStats: "Combat Stats",
    physicalAttack: "Physical Attack",
    magicalAttack: "Magical Attack",
    critChance: "Critical Chance",
    attackSpeed: "Attack Speed",
    cooldownReduction: "Cooldown Reduction",

    // Inventory Popup
    inventoryPopupTitle: "Inventory",
    inventoryPopupDesc: "Items you've collected. Click an item to see available actions.",
    inventoryEmpty: "Your inventory is empty.",
    tier: "Tier {tier}",
    useOnSelf: "Use on Self",
    useOnTarget: "Use on {target}",
    effects: "Effects",
    healthShort: "HP",
    staminaShort: "Stamina",
    
    // Crafting Popup
    craftingDesc: "Combine items to create new tools and supplies.",
    ingredients: "Ingredients",
    craft: "Craft",
    successChance: "Success chance: {chance}%",

    // Building Popup
    buildingDesc: "Use materials to build structures.",
    build: "Build",
    materialsNeeded: "Materials Needed",
    noMaterialsNeeded: "No materials needed.",
    buildStructure: "Build {structureName}",
    builtStructure: "You have successfully built a {structureName}.",
    
    // Minimap
    minimap: "Minimap",
    environmentTemperature: "Env. Temp: {temp}°C",
    environmentTempTooltip: "The current temperature of the area, affected by weather and heat sources like campfires.",
    fullMapDescription: "Hover over a cell to see details. The map shows all explored areas.",

    // Example Prompts
    example1: "A post-apocalyptic city overrun by sentient plants.",
    example2: "A high-fantasy kingdom floating on clouds.",
    example3: "A cyberpunk noir detective story on Mars.",
    example4: "A peaceful village of talking animals with a dark secret.",
    example5: "An underwater research facility that has lost contact with the surface.",
    example6: "A Wild West town where dinosaurs are used instead of horses.",
    example7: "A magical library where books come to life and can be dangerous.",
    example8: "A generation ship traveling through space, where society has forgotten its original mission.",
    example9: "A steampunk world powered by captured lightning elementals.",
    example10: "A journey into the dream world to save someone from a magical coma.",

    // Dice Rolls
    diceRollMessage: "You roll a d20... It's a {roll}! ({level})",
    criticalFailure: "Critical Failure",
    failure: "Failure",
    success: "Success",
    greatSuccess: "Great Success",
    criticalSuccess: "Critical Success",

    // Item Categories
    Weapon: "Weapon",
    Material: "Material",
    "Energy Source": "Energy Source",
    Food: "Food",
    Data: "Data",
    Tool: "Tool",
    Equipment: "Equipment",
    Support: "Support",
    Magic: "Magic",
    Fusion: "Fusion",
    loadingAdventure: "Loading your adventure...",
    
    // Tutorial
    tutorialTitle: "Help / Tutorial",
    tutorialDesc: "Expand the sections below to learn about the game's features.",
    gettingStartedTitle: "🚀 Getting Started",
    gettingStartedContent: `Welcome to Dreamland Engine! Your goal is to explore, survive, and shape the world around you.
    - **Exploration:** Use the arrow keys to move. New parts of the world are generated as you explore.
    - **Interaction:** Use the action buttons or the custom action input to interact with your environment.
    - **The AI Storyteller:** The game is powered by an AI that narrates your journey, making every playthrough unique.`,
    uiTitle: "🖥️ Understanding the Interface",
    uiContent: `- **Left Panel:** This is your story log. All narratives and system messages appear here.
    - **Right Panel:** This is your control hub.
        - **Minimap:** Shows your immediate surroundings. Click it to open a larger map.
        - **Move & Attack:** Your primary movement and combat controls.
        - **Status/Inventory/Crafting/Building:** Buttons to open popups for detailed information and actions.
        - **Actions:** Context-sensitive actions based on what's in your current location.`,
    combatTitle: "⚔️ Combat & Skills",
    combatContent: `- **Attacking:** Use the Sword button to attack an enemy in your current location.
    - **Dice Rolls:** All major actions (attacking, using skills) involve a d20 dice roll. The result (from Critical Failure to Critical Success) determines the outcome. The AI will narrate the result.
    - **Skills:** Use skills to gain an advantage. They cost Mana. You can unlock new skills by performing certain actions (e.g., attacking, moving).`,
    craftingBuildTitle: "🛠️ Crafting & Building",
    craftingBuildContent: `- **Crafting:** Collect materials from the world and use the Crafting window to create new items. The AI might even invent new recipes for you as you play!
    - **Building:** Use the Building window to construct structures. Building costs materials and stamina. Structures like shelters allow you to rest and recover.`,
    survivalTitle: "❤️‍🩹 Survival",
    survivalContent: `- **HP, Mana, Stamina:** Manage your core stats. HP is your health, Mana is for skills, and Stamina is for physical actions like moving and building.
    - **Body Temperature:** Your body temperature (shown in the Status popup) is affected by the environment. If it gets too low or too high, you will suffer negative effects. Build fires or shelters to manage it.
    - **Resting:** Find or build a shelter to rest, which restores HP and Stamina.`,
    customActionsTitle: "💬 Custom Actions & The AI",
    customActionsContent: `The heart of this game is the AI. You are not limited to the buttons.
    - **Be Creative:** Type anything into the custom action box. For example: "look for shelter", "try to fish in the river", "give the wolf some meat".
    - **AI Interpretation:** The AI will interpret your action and decide what happens next, using the game's rules and tools to guide the outcome. Experiment and see what's possible!`,

    // New Continue Game Screen
    welcomeBack: "Welcome Back!",
    gameInProgress: "You have a game in progress.",
    continueJourney: "Continue Journey",
    startNewAdventure: "Start New Adventure",

    // Skills
    skillHealName: 'Heal',
    skillHealDesc: 'Use mana to restore a small amount of health.',
    skillFireballName: 'Fireball',
    skillFireballDesc: 'Launch a ball of fire at an enemy, dealing magical damage.',
    skillLifeSiphonName: 'Life Siphon',
    skillLifeSiphonDesc: 'Deals magical damage and heals you for 50% of the damage dealt.',
    skillChainLightningName: 'Chain Lightning',
    skillChainLightningDesc: 'Creates a powerful lightning bolt. Higher damage than Fireball.',
    skillBlinkName: 'Blink',
    skillBlinkDesc: 'Instantly teleport to a nearby location in sight.',
  },
  vi: {
    gameTitle: "Dreamland Engine",
    // Language Selector
    selectLanguage: "Chọn Ngôn Ngữ",

    // World Setup
    worldSetupTitle: "Tạo Thế Giới Của Bạn",
    worldSetupStep1: "Bước 1: Mô tả ý tưởng của bạn. Có thể ngắn gọn hoặc chi tiết.",
    worldSetupPlaceholder: "Ví dụ: 'Một ngọn hải đăng cô độc trên bờ biển bão tố, bị một bóng ma ám ảnh.'",
    suggestKeywords: "Gợi ý từ khóa",
    suggesting: "Đang gợi ý...",
    tryTheseIdeas: "Hoặc thử một trong những ý tưởng này:",
    generateWorlds: "Tạo các phiên bản thế giới",
    
    worldSetupStep2: "Bước 2: AI đã tạo ra 3 phiên bản. Hãy dùng các nút < > để xem và chọn các yếu tố bạn thích nhất!",
    mixAndMatchTitle: "Chọn và Kết hợp",
    generatingUniverses: "Đang kiến tạo các vũ trụ... Xin chờ chút!",
    worldName: "Tên Thế Giới",
    openingNarrative: "Cốt Truyện Mở Đầu",
    startingBiome: "Môi Trường Bắt Đầu",
    startingSkill: "Kỹ năng khởi đầu",
    startingEquipment: "Trang Bị Ban Đầu",
    itemsFromChoice: "Vật phẩm của Lựa chọn {index}",
    firstQuest: "Nhiệm Vụ Đầu Tiên",
    questFromChoice: "Nhiệm vụ của Lựa chọn {index}",
    yourWorld: "Thế giới của bạn:",
    yourWorldDescription: "Đây là thế giới được tạo từ các lựa chọn của bạn.",
    backAndEdit: "← Quay lại & Chỉnh sửa",
    startAdventure: "Bắt đầu cuộc phiêu lưu →",

    // Toasts
    error: "Lỗi",
    suggestionError: "Không thể tạo gợi ý lúc này.",
    noIdeaError: "Chưa có ý tưởng!",
    noIdeaErrorDesc: "Vui lòng mô tả thế giới bạn muốn tạo.",
    worldGenError: "Lỗi Tạo Thế Giới",
    worldGenErrorDesc: "Năng lượng vũ trụ đang bị nhiễu loạn. Vui lòng thử lại.",
    offlineModeActive: "Chế độ Ngoại tuyến",
    offlineToastDesc: "Đừng lo, bạn vẫn có thể tiếp tục cuộc hành trình của mình khi không có mạng, nhưng có kết nối sẽ cho trải nghiệm tốt nhất.",
    notEnoughIngredients: "Không đủ nguyên liệu.",
    notEnoughStamina: "Không đủ thể lực!",
    notEnoughStaminaDesc: "Cần {cost} thể lực để xây dựng, nhưng bạn chỉ còn {current}.",
    craftSuccessTitle: "Chế tạo thành công!",
    craftSuccess: "Bạn đã chế tạo thành công: {itemName}",
    craftFailTitle: "Chế tạo Thất bại!",
    craftFail: "Nỗ lực chế tạo {itemName} của bạn đã thất bại và các nguyên liệu đã bị mất.",
    newRecipeIdea: "Ý tưởng công thức mới!",

    // Game Layout
    wentDirection: "Bạn đi về phía {direction}.",
    directionNorth: "bắc",
    directionSouth: "nam",
    directionEast: "đông",
    directionWest: "tây",
    observeEnemy: "Bạn quan sát {npc}. Nó trông hung dữ!",
    talkToNpc: "Bạn nói chuyện với {npc}. Họ kể về một kho báu gần đây.",
    questUpdated: "Nhiệm vụ đã được cập nhật.",
    exploreArea: "Bạn khám phá khu vực, thấy một dấu vết lạ.",
    pickupItem: "Bạn nhặt được {item}!",
    attackEnemy: "Bạn tấn công {enemyType}, gây {playerDamage} sát thương.",
    enemyDefeated: "Bạn đã hạ gục {enemyType}!",
    enemyHpLeft: "{enemyType} còn {hp} HP.",
    enemyRetaliates: "{enemyType} phản đòn, bạn mất {damage} HP.",
    youFell: "Bạn đã ngã xuống!",
    customActionResponses: {
      checkTree: 'Bạn kiểm tra cây, tìm thấy một quả táo!',
      noTree: 'Chỉ có cát hoặc cỏ ở đây!',
      dig: 'Bạn đào đất, thấy một đồng xu!',
      groundTooHard: 'Đất cứng hoặc cỏ quá, không đào được!',
      reapGrass: 'Bạn gặt cỏ, thu được cỏ khô!',
      noGrass: 'Không có cỏ để gặt!',
      lookAround: 'Bạn nhìn quanh, thấy một con đường mờ mịt.',
      actionFailed: 'Hành động không được nhận diện. Thử lại!',
    },
    status: "Trạng thái",
    statusTooltip: "Xem máu, năng lượng và nhiệm vụ.",
    inventory: "Túi đồ",
    inventoryTooltip: "Kiểm tra các vật phẩm bạn đang mang.",
    crafting: "Chế tạo",
    craftingTooltip: "Mở cửa sổ chế tạo.",
    building: "Xây dựng",
    buildingTooltip: "Mở cửa sổ xây dựng. Xây dựng sẽ tốn thể lực và thời gian.",
    availableActions: "Hành động có sẵn",
    customActionPlaceholder: "Hành động tùy chỉnh...",
    submit: "Gửi",
    submitTooltip: "Gửi hành động tùy chỉnh của bạn.",
    aiStoryteller: "AI Kể Chuyện",
    aiStorytellerDesc: "Bật để AI tạo ra các câu chuyện động. Tắt để trải nghiệm kiểu cổ điển, dựa trên quy tắc (hoạt động ngoại tuyến).",
    skills: "Kỹ năng",
    manaCost: "Tiêu tốn Mana",
    structureActions: "Hành động Công trình",
    rest: "Nghỉ ngơi",
    restTooltip: "Nghỉ ngơi tại {shelterName} để hồi {hp} máu và {stamina} thể lực.",
    restInShelter: "Bạn nghỉ ngơi trong {shelterName}...",
    restSuccess: "Bạn đã phục hồi {restoration}.",
    restSuccessTemp: "Thân nhiệt của bạn trở lại mức dễ chịu.",
    restNoEffect: "Bạn đã hoàn toàn khỏe mạnh. Nghỉ ngơi thêm cũng không có tác dụng.",

    // Controls
    moveAndAttack: "Di chuyển & Tấn công",
    moveUp: "Đi lên",
    moveLeft: "Trái",
    moveRight: "Phải",
    moveDown: "Đi xuống",
    moveNorthTooltip: "Đi lên (North)",
    moveWestTooltip: "Đi sang trái (West)",
    attackTooltip: "Tấn công",
    moveEastTooltip: "Đi sang phải (East)",
    moveSouthTooltip: "Đi xuống (South)",

    // Status Popup
    playerStatus: "Trạng thái người chơi",
    playerStatusDesc: "Tình trạng hiện tại và các nhiệm vụ đang hoạt động.",
    health: "Máu: {hp}/100",
    mana: "Năng lượng: {mana}/50",
    stamina: "Thể lực: {stamina}/100",
    bodyTemperature: "Thân Nhiệt: {temp}°C",
    bodyTempDesc: "Cơ thể bạn cố gắng duy trì ở 37°C. Nhiệt độ khắc nghiệt sẽ ảnh hưởng đến thể lực và máu.",
    tempDangerFreezing: "Bạn đang rét cóng! Máu đang giảm dần.",
    tempWarningCold: "Bạn bắt đầu cảm thấy lạnh. Cử động trở nên chậm chạp.",
    tempWarningHot: "Cái nóng khiến bạn uể oải. Thể lực đang bị tiêu hao.",
    tempDangerHot: "Bạn đang bị quá nhiệt! Thể lực đang giảm nhanh chóng.",
    companions: "Bạn đồng hành",
    noCompanions: "Chưa có bạn đồng hành nào.",
    quests: "Nhiệm vụ",
    noQuests: "Không có nhiệm vụ nào.",
    combatStats: "Chỉ số chiến đấu",
    physicalAttack: "Công vật lý",
    magicalAttack: "Công phép",
    critChance: "Tỷ lệ chí mạng",
    attackSpeed: "Tốc độ đánh",
    cooldownReduction: "Giảm hồi chiêu",

    // Inventory Popup
    inventoryPopupTitle: "Túi đồ",
    inventoryPopupDesc: "Vật phẩm bạn đã thu thập. Nhấn vào một vật phẩm để xem các hành động có sẵn.",
    inventoryEmpty: "Túi đồ của bạn trống rỗng.",
    tier: "Cấp {tier}",
    useOnSelf: "Dùng cho bản thân",
    useOnTarget: "Dùng cho {target}",
    effects: "Hiệu ứng",
    healthShort: "Máu",
    staminaShort: "Thể lực",
    
    // Crafting Popup
    craftingDesc: "Kết hợp vật phẩm để tạo công cụ và vật tư mới.",
    ingredients: "Nguyên liệu",
    craft: "Chế tạo",
    successChance: "Tỷ lệ thành công: {chance}%",

    // Building Popup
    buildingDesc: "Sử dụng vật liệu để xây dựng các công trình.",
    build: "Xây",
    materialsNeeded: "Vật liệu cần thiết",
    noMaterialsNeeded: "Không cần vật liệu.",
    buildStructure: "Xây {structureName}",
    builtStructure: "Bạn đã xây dựng thành công một {structureName}.",

    // Minimap
    minimap: "Bản đồ nhỏ",
    environmentTemperature: "Nhiệt độ MT: {temp}°C",
    environmentTempTooltip: "Nhiệt độ hiện tại của khu vực, bị ảnh hưởng bởi thời tiết và các nguồn nhiệt như lửa trại.",
    fullMapDescription: "Di chuột qua một ô để xem chi tiết. Bản đồ hiển thị tất cả các khu vực đã được khám phá.",

    // Example Prompts
    example1: "Một thành phố hậu tận thế bị cây cối có tri giác xâm chiếm.",
    example2: "Một vương quốc giả tưởng cao trên mây.",
    example3: "Một câu chuyện trinh thám cyberpunk noir trên Sao Hỏa.",
    example4: "Một ngôi làng yên bình của các loài động vật biết nói với một bí mật đen tối.",
    example5: "Một cơ sở nghiên cứu dưới nước đã mất liên lạc với bề mặt.",
    example6: "Một thị trấn miền Tây hoang dã nơi khủng long được dùng thay cho ngựa.",
    example7: "Một thư viện phép thuật nơi những cuốn sách trở nên sống động và có thể gây nguy hiểm.",
    example8: "Một con tàu thế hệ du hành trong không gian, nơi xã hội đã quên mất sứ mệnh ban đầu.",
    example9: "Một thế giới steampunk được cung cấp năng lượng bởi các nguyên tố sét bị bắt giữ.",
    example10: "Hành trình vào thế giới giấc mơ để cứu ai đó khỏi cơn hôn mê phép thuật.",
    
    // Dice Rolls
    diceRollMessage: "Bạn gieo xúc xắc d20... Kết quả là {roll}! ({level})",
    criticalFailure: "Thất bại Thảm hại",
    failure: "Thất bại",
    success: "Thành công",
    greatSuccess: "Thành công Lớn",
    criticalSuccess: "Thành công Xuất sắc",
    
    // Item Categories
    Weapon: "Vũ khí",
    Material: "Nguyên liệu",
    "Energy Source": "Nguồn năng lượng",
    Food: "Thức ăn",
    Data: "Data",
    Tool: "Công cụ",
    Equipment: "Trang bị",
    Support: "Vật phẩm hỗ trợ",
    Magic: "Phép thuật",
    Fusion: "Fusion",
    loadingAdventure: "Đang tải cuộc phiêu lưu của bạn...",

    // Tutorial
    tutorialTitle: "Trợ giúp / Hướng dẫn",
    tutorialDesc: "Mở rộng các mục bên dưới để tìm hiểu về các tính năng của trò chơi.",
    gettingStartedTitle: "🚀 Bắt đầu",
    gettingStartedContent: `Chào mừng bạn đến với Ký Sự Lãng Du! Mục tiêu của bạn là khám phá, sinh tồn và định hình thế giới xung quanh.
    - **Khám phá:** Sử dụng các phím mũi tên để di chuyển. Các phần mới của thế giới sẽ được tạo ra khi bạn khám phá.
    - **Tương tác:** Sử dụng các nút hành động hoặc ô nhập hành động tùy chỉnh để tương tác với môi trường của bạn.
    - **Người kể chuyện AI:** Trò chơi được hỗ trợ bởi AI tường thuật lại hành trình của bạn, làm cho mỗi lần chơi đều độc đáo.`,
    uiTitle: "🖥️ Tìm hiểu Giao diện",
    uiContent: `- **Bảng bên trái:** Đây là nhật ký câu chuyện của bạn. Tất cả các tường thuật và thông báo hệ thống sẽ xuất hiện ở đây.
    - **Bảng bên phải:** Đây là trung tâm điều khiển của bạn.
        - **Bản đồ nhỏ:** Hiển thị môi trường xung quanh bạn. Nhấp vào nó để mở bản đồ lớn hơn.
        - **Di chuyển & Tấn công:** Các nút điều khiển chính cho di chuyển và chiến đấu.
        - **Trạng thái/Túi đồ/Chế tạo/Xây dựng:** Các nút để mở cửa sổ bật lên cho thông tin và hành động chi tiết.
        - **Hành động:** Các hành động theo ngữ cảnh dựa trên những gì có ở vị trí hiện tại của bạn.`,
    combatTitle: "⚔️ Chiến đấu & Kỹ năng",
    combatContent: `- **Tấn công:** Sử dụng nút Thanh kiếm để tấn công kẻ thù ở vị trí hiện tại của bạn.
    - **Gieo xúc xắc:** Tất cả các hành động chính (tấn công, sử dụng kỹ năng) đều liên quan đến việc gieo xúc xắc d20. Kết quả (từ Thất bại Thảm hại đến Thành công Xuất sắc) quyết định kết quả. AI sẽ tường thuật lại kết quả.
    - **Kỹ năng:** Sử dụng kỹ năng để có lợi thế. Chúng tiêu tốn Mana. Bạn có thể mở khóa các kỹ năng mới bằng cách thực hiện các hành động nhất định (ví dụ: tấn công, di chuyển).`,
    craftingBuildTitle: "🛠️ Chế tạo & Xây dựng",
    craftingBuildContent: `- **Chế tạo:** Thu thập vật liệu từ thế giới và sử dụng cửa sổ Chế tạo để tạo ra các vật phẩm mới. AI thậm chí có thể phát minh ra các công thức mới cho bạn khi bạn chơi!
    - **Xây dựng:** Sử dụng cửa sổ Xây dựng để xây dựng các công trình. Việc xây dựng tốn vật liệu và thể lực. Các công trình như nơi trú ẩn cho phép bạn nghỉ ngơi và phục hồi.`,
    survivalTitle: "❤️‍🩹 Sinh tồn",
    survivalContent: `- **Máu, Mana, Thể lực:** Quản lý các chỉ số cốt lõi của bạn. Máu là sức khỏe của bạn, Mana dành cho kỹ năng và Thể lực dành cho các hành động thể chất như di chuyển và xây dựng.
    - **Thân nhiệt:** Thân nhiệt của bạn (hiển thị trong cửa sổ Trạng thái) bị ảnh hưởng bởi môi trường. Nếu nó quá thấp hoặc quá cao, bạn sẽ phải chịu các hiệu ứng tiêu cực. Hãy đốt lửa hoặc xây dựng nơi trú ẩn để quản lý nó.
    - **Nghỉ ngơi:** Tìm hoặc xây dựng một nơi trú ẩn để nghỉ ngơi, giúp phục hồi Máu và Thể lực.`,
    customActionsTitle: "💬 Hành động Tùy chỉnh & AI",
    customActionsContent: `Trái tim của trò chơi này là AI. Bạn không bị giới hạn bởi các nút bấm.
    - **Hãy sáng tạo:** Nhập bất cứ thứ gì vào ô hành động tùy chỉnh. Ví dụ: "tìm nơi trú ẩn", "thử câu cá trong sông", "dùng thịt dụ sói".
    - **AI diễn giải:** AI sẽ diễn giải hành động của bạn và quyết định điều gì sẽ xảy ra tiếp theo, sử dụng các quy tắc và công cụ của trò chơi để định hướng kết quả. Hãy thử nghiệm và xem những gì có thể!`,

    // New Continue Game Screen
    welcomeBack: "Chào mừng trở lại!",
    gameInProgress: "Bạn có một trò chơi đang dang dở.",
    continueJourney: "Tiếp tục Hành trình",
    startNewAdventure: "Bắt đầu Cuộc phiêu lưu Mới",
    
    // Skills
    skillHealName: 'Hồi Máu',
    skillHealDesc: 'Dùng mana để hồi lại một lượng máu.',
    skillFireballName: 'Quả Cầu Lửa',
    skillFireballDesc: 'Tung một quả cầu lửa vào kẻ địch, gây sát thương phép.',
    skillLifeSiphonName: 'Hút Sinh Lực',
    skillLifeSiphonDesc: 'Gây sát thương phép và hồi lại máu bằng 50% sát thương gây ra.',
    skillChainLightningName: 'Sét Chuỗi',
    skillChainLightningDesc: 'Tạo ra một tia sét mạnh mẽ. Sát thương cao hơn Quả Cầu Lửa.',
    skillBlinkName: 'Dịch Chuyển',
    skillBlinkDesc: 'Dịch chuyển tức thời đến một vị trí gần đó trong tầm mắt.',
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)['en'] | keyof (typeof translations)['vi'];
