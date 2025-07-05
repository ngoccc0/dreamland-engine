
export const corrupted_lands_vi = {
    descriptionTemplates: [
        'Mặt đất [adjective] và nứt nẻ. Không khí nặng trĩu mùi [smell].',
        'Một vùng đất [adjective] nơi sự sống dường như đã lụi tàn. Những [feature] méo mó vươn lên trời.',
    ],
    adjectives: ['hắc ám', 'chết chóc', 'bị nguyền rủa'],
    features: ['tinh thể bóng tối', 'bộ xương cũ', 'cây cối khô héo'],
    smells: ['lưu huỳnh', 'sự mục rữa', 'ma thuật hắc ám'],
    sounds: ['tiếng gió rít', 'sự im lặng chết chóc', 'tiếng thì thầm ma quái'],
    NPCs: [],
    items: [
        { name: 'Mảnh Xương', conditions: { chance: 0.4 } },
        { name: 'Cát Ma Thuật', conditions: { magicAffinity: { min: 8 }, chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};

export const corrupted_lands_en = {
    descriptionTemplates: [
        'The ground is [adjective] and cracked. The air is heavy with the smell of [smell].',
        'A [adjective] land where life seems to have withered. Twisted [feature] reach for the sky.',
    ],
    adjectives: ['dark', 'dead', 'cursed'],
    features: ['shadow crystals', 'old skeletons', 'withered trees'],
    smells: ['sulfur', 'decay', 'dark magic'],
    sounds: ['howling wind', 'deadly silence', 'eerie whispers'],
    NPCs: [],
    items: [
        { name: 'Mảnh Xương', conditions: { chance: 0.4 } },
        { name: 'Cát Ma Thuật', conditions: { magicAffinity: { min: 8 }, chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};
