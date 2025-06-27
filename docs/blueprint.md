# **App Name**: Terra Textura

## Core Features:

- Minimap Grid Display: Display a 5x5 minimap grid with icons representing different biomes (forest, grassland, desert) and player/enemy locations.
- Touch Optimized Directional Input: Implement directional movement using North, South, East, and West buttons and also allow an 'Attack' action (50x50 button sizes, optimized for touch).
- Responsive Layout: Design a responsive UI layout with content on the left (70% width) and sidebar on the right (30% width) to adapt to both desktop and mobile screen sizes.
- Chunk Description: Show chunk descriptions within DescriptionLabel in the content section.
- Action Buttons and Text Input: Use action buttons (1, 2, 3) and text input field to trigger possible actions.
- Status Display: Open pop-up StatusPopup windows to show HP, mana and current quests.
- Inventory Display: Open pop-up InventoryPopup windows to show acquired objects.
- Godot Extension Support: Use Godot extensions to run the game.
- AI Character Control: Use AI to control non player characters and their actions. The AI will also analyze the player's input, and the results of those actions. This will serve as a tool to drive the narrative.
- AI Chunk Generation: Use AI, using provided templates, to generate new chunks in the world.

## Style Guidelines:

- Primary color: Dark brown (#4A3A31) to evoke a natural, earthy feel.
- Background color: Light beige (#F2EAD3), very slightly tinted with the primary brown.
- Accent color: Desaturated orange (#C49559) for buttons and interactive elements.
- Body and headline font: 'Literata', a serif typeface to support long stretches of game-related narrative.
- Use minimalist icons for map elements. Dark Green for forest, light green for grasslands, yellow for desert, red for player, and light red for enemy
- Employ a clear 70/30 split layout between content (left) and sidebar (right) for optimal content presentation and easy navigation.
- Use subtle fade-in/fade-out animations for displaying descriptions, opening popups, and state transitions.