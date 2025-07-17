# **Dreamland Engine - Nhật Ký Phát Triển (Update Log)**

Chào mừng các Đội trưởng và những người đồng hành đến với nhật ký phát triển chính thức của Dreamland Engine! Tại đây, chúng tôi sẽ ghi lại những thay đổi, nâng cấp và cả những quyết định thiết kế quan trọng đã định hình nên thế giới này.

---

## **Bản cập nhật v0.3.1 - "Giao diện Chế tạo Thông minh" (18/07/2025)**

*Tên mã: The Artisan's Workbench*

### 🌟 **Giới thiệu chung**

Bản cập nhật này tập trung hoàn toàn vào việc cải thiện trải nghiệm người dùng (UX) cho một trong những tính năng cốt lõi nhất: Chế tạo. Dựa trên bản kế hoạch chi tiết, chúng ta đã biến một danh sách công thức đơn giản thành một giao diện thông minh, có khả năng sắp xếp và lọc, giúp người chơi dễ dàng tìm thấy thứ họ cần và đưa ra quyết định nhanh hơn.

### ✨ **Thay đổi chính & Phân tích**

1.  **Tính năng Sắp xếp theo Khả năng Chế tạo (`Sort by Craftability`):**
    *   **Vấn đề:** Các công thức được liệt kê một cách lộn xộn, khiến người chơi phải cuộn và kiểm tra từng công thức để xem họ có thể chế tạo những gì.
    *   **Giải pháp:**
        *   Một thuật toán mới đã được triển khai để tính toán `craftabilityScore` (điểm khả năng chế tạo) cho mỗi công thức. Điểm này được tính bằng tỷ lệ `(số nguyên liệu sở hữu / tổng số nguyên liệu yêu cầu)`.
        *   Thêm một nút "Sắp xếp" vào giao diện, cho phép người chơi chuyển đổi giữa hai chế độ:
            *   **Mặc định (`Craftability`):** Sắp xếp công thức theo `craftabilityScore` giảm dần. Các công thức có thể chế tạo ngay (100%) sẽ luôn được đẩy lên đầu.
            *   **Theo vần (`A-Z`):** Sắp xếp theo tên vật phẩm kết quả.
    *   **Kết quả:** Người chơi giờ đây có thể thấy ngay lập tức những gì họ có thể chế tạo và những gì họ sắp có thể chế tạo, giúp việc lập kế hoạch thu thập tài nguyên trở nên dễ dàng hơn rất nhiều.

2.  **Bộ lọc "Chỉ Hiển thị có thể Chế tạo" (`Show only craftable`):**
    *   **Vấn đề:** Khi có hàng trăm công thức, việc tìm kiếm những công thức đã đủ nguyên liệu vẫn còn khó khăn.
    *   **Giải pháp:** Thêm một công tắc (`Switch`) vào giao diện. Khi được bật, nó sẽ lọc danh sách và chỉ hiển thị những công thức có `craftabilityScore` là 100%.
    *   **Kết quả:** Cung cấp một chế độ xem "tập trung", loại bỏ mọi sự phân tâm và giúp người chơi thực hiện hành động chế tạo một cách nhanh chóng.

3.  **Cải thiện Phản hồi Trực quan (Visual Feedback):**
    *   **Vấn đề:** Giao diện cũ không cho người chơi biết rõ họ thiếu gì.
    *   **Giải pháp:**
        *   **Màu sắc Nguyên liệu:** Trong danh sách nguyên liệu, các vật phẩm đã đủ số lượng sẽ có màu xanh lá cây, trong khi những vật phẩm còn thiếu sẽ có màu đỏ.
        *   **Tooltip chi tiết:** Di chuột qua một công thức sẽ hiển thị một `Tooltip` thông báo chính xác các nguyên liệu còn thiếu (ví dụ: "Bạn còn thiếu: 2x Sắt, 1x Than củi").
        *   **Tooltip cho nút Crafting chính:** Tooltip của nút Búa trên giao diện chính giờ sẽ hiển thị số lượng công thức có thể chế tạo ngay (`"Mở cửa sổ chế tạo. (3 có thể chế tạo ngay)"`), cung cấp thông tin hữu ích mà không cần mở popup.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Giao diện chế tạo giờ đây trực quan, thông minh và ít gây khó chịu hơn đáng kể. Người chơi có thể nhanh chóng đánh giá tình hình tài nguyên và đưa ra quyết định chế tạo một cách hiệu quả.
*   **Khả năng mở rộng:** Nền tảng logic `craftabilityScore` này có thể được tái sử dụng trong tương lai cho các tính năng khác, ví dụ như gợi ý cho người chơi nên đi thu thập tài nguyên gì tiếp theo.

---

## **Bản cập nhật v0.2.62 - "Kiến trúc Bất hoại" (17/07/2025)**

*Tên mã: Indestructible Architecture*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật quan trọng, giải quyết triệt để lỗi cấu trúc dữ liệu đã gây ra các lỗi `TypeError` trong engine sinh thế giới. Bằng cách tái cấu trúc lại cách các `structure` (công trình) được định nghĩa và tham chiếu, chúng ta đã tạo ra một hệ thống dữ liệu nhất quán, mạnh mẽ và loại bỏ hoàn toàn các lỗi liên quan đến "entity không hợp lệ".

### ✨ **Thay đổi chính & Phân tích**

1.  **Tái cấu trúc `StructureDefinitionSchema`:**
    *   **Vấn đề:** Các thuộc tính `loot` và `conditions` cho các công trình được định nghĩa một cách không nhất quán, đôi khi nằm trong file template, đôi khi lại thiếu, gây ra lỗi khi engine cố gắng xử lý chúng như một thực thể độc lập.
    *   **Giải pháp:** Đã thực hiện một cuộc "đại tu" nhỏ nhưng quan trọng cho `StructureDefinitionSchema` (trong `src/lib/game/definitions/structure.ts`). Thuộc tính `loot` và `conditions` giờ đây đã chính thức trở thành một phần của định nghĩa gốc của một công trình. Điều này đảm bảo rằng bất kỳ công trình nào cũng có một cấu trúc dữ liệu chuẩn, dễ dự đoán.

2.  **Chuẩn hóa Dữ liệu trong `structures.ts`:**
    *   **Vấn đề:** Dữ liệu về `loot` và `conditions` của "Cửa hầm mỏ bỏ hoang" bị đặt sai chỗ trong các file template (`mountain.ts`, `cave.ts`).
    *   **Giải pháp:** Toàn bộ thông tin `loot` và `conditions` đã được di chuyển về đúng "nhà" của nó: file định nghĩa gốc `src/lib/game/structures.ts`. Giờ đây, file này là nguồn chân lý duy nhất cho tất cả các thuộc tính của một công trình.

3.  **Đơn giản hóa Tham chiếu Template:**
    *   **Vấn đề:** Các file template như `mountain.ts` và `cave.ts` phải sử dụng một "wrapper" object phức tạp (`{ data: ..., conditions: ... }`) để tham chiếu đến công trình.
    *   **Giải pháp:** Sau khi đã chuẩn hóa dữ liệu gốc, các file template giờ đây chỉ cần tham chiếu trực tiếp đến `structureDefinitions['Cửa hầm mỏ bỏ hoang']`. Cách làm này không chỉ sửa lỗi mà còn giúp cho các file template trở nên sạch sẽ, dễ đọc và dễ bảo trì hơn rất nhiều.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ tin cậy tuyệt đối:** Lỗi `SKIPPING entity data is missing 'name' or 'type' property` liên quan đến `structure` đã được loại bỏ hoàn toàn. Engine sinh thế giới giờ đây sẽ không bao giờ gặp phải lỗi do dữ liệu công trình không nhất quán.
*   **Khả năng bảo trì:** Việc tập trung tất cả các thuộc tính của một thực thể vào một nơi duy nhất giúp việc quản lý, cân bằng game và thêm nội dung mới trong tương lai trở nên dễ dàng và ít rủi ro hơn. Nền móng dữ liệu của chúng ta giờ đây thực sự vững chắc.
---

## **Bản cập nhật v0.2.61 - "Hoàn Thiện" (17/07/2025)**

*Tên mã: Polishing*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật "dọn dẹp" cuối cùng, tập trung vào việc gia cố các hàm cốt lõi của engine để chống lại các lỗi do dữ liệu template không nhất quán. Mục tiêu là đảm bảo engine hoạt động ổn định trong mọi trường hợp, ngay cả khi đối mặt với các template được định nghĩa thiếu sót.

### ✨ **Thay đổi chính & Phân tích**

1.  **Gia cố `generateOfflineNarrative`:**
    *   **Vấn đề:** Lỗi `TypeError` xảy ra khi hàm cố gắng gọi `.filter()` trên thuộc tính `descriptionTemplates`, cho thấy thuộc tính này có thể không phải là một mảng như mong đợi.
    *   **Giải pháp:** Đã thêm một lớp bảo vệ bằng cách sử dụng `const narrativeTemplates = biomeTemplates.descriptionTemplates || []`. Điều này đảm bảo biến `narrativeTemplates` luôn là một mảng, ngăn chặn lỗi runtime.

2.  **Gia cố `selectEntities`:**
    *   **Vấn đề:** Lỗi `TypeError` vẫn tiếp diễn, cho thấy một phần tử `undefined` hoặc `{}` rỗng vẫn có thể lọt vào mảng `possibleEntities`.
    *   **Giải pháp:** Đã thêm hai lớp phòng vệ mới bên trong hàm `selectEntities`:
        *   Sử dụng `.filter(Boolean)` ngay từ đầu để loại bỏ các phần tử `null` hoặc `undefined`.
        *   Thêm các khối kiểm tra `if (!entity)` và `if (!entity.name)` bên trong vòng lặp để ghi log lỗi và bỏ qua các thực thể không hợp lệ, ngăn chặn game bị crash.

3.  **Sửa lỗi dữ liệu gốc:**
    *   **Phân tích:** Qua quá trình rà soát, đã phát hiện các dấu phẩy thừa ở cuối các mảng `items` và `enemies` trong các file `forest.ts` và `mountain.ts`, gây ra việc tạo ra các phần tử `{}` rỗng.
    *   **Giải pháp:** Đã loại bỏ tất cả các dấu phẩy thừa được tìm thấy để đảm bảo tính toàn vẹn của dữ liệu template.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ tin cậy tuyệt đối:** Engine giờ đây có khả năng tự phục hồi và hoạt động ổn định ngay cả khi các tệp template (do người dùng hoặc modder tạo ra) có lỗi cú pháp hoặc thiếu dữ liệu.
*   **Hoàn tất Type-Safety:** Với bản vá này, toàn bộ các bài kiểm tra TypeScript của dự án đã thành công. Nền móng mã nguồn của chúng ta giờ đây không chỉ vững chắc mà còn hoàn toàn an toàn về kiểu dữ liệu, sẵn sàng cho việc mở rộng các tính năng lớn trong tương lai.

---

## **Bản cập nhật v0.2.59 - "Soi Rọi Logic" (16/07/2025)**

*Tên mã: Logic Illumination*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật "hậu cần", tập trung vào việc tạo ra tài liệu kỹ thuật để hỗ trợ quá trình debug. Thay vì thay đổi mã nguồn, bản cập nhật này bổ sung một báo cáo chi tiết vào thư mục `docs/`, phân tích sâu về hai quy trình cốt lõi của engine: **Tạo Chunk Mới** và **Tải Thế giới từ Dữ liệu đã lưu**.

### ✨ **Thay đổi chính & Phân tích**

1.  **Tạo Báo cáo Phân tích `report_chunk_creation_and_loading.md`:**
    *   **Mục tiêu:** Để truy tìm nguyên nhân gốc rễ của lỗi `TypeError` trong `generateChunkContent`, chúng ta cần hiểu rõ luồng dữ liệu của một đối tượng `Chunk`.
    *   **Nội dung báo cáo:**
        *   **Logic Tạo Chunk Mới:** Phân tích chi tiết hàm `generateRegion`, cho thấy một `Chunk` được tạo ra với đầy đủ các thuộc tính vật lý (bao gồm `terrain`) trước khi được truyền vào `generateChunkContent` để sinh nội dung (mô tả, vật phẩm).
        *   **Logic Tải Thế giới:** Phân tích hook `useGameInitialization`, cho thấy toàn bộ đối tượng `World` được tải trực tiếp từ repository (IndexedDB/Firebase) và ghi đè vào state của game.
    *   **Kết luận từ báo cáo:** Lỗi `terrain` không hợp lệ có thể xuất phát từ hai nguồn: (1) Lỗi trong logic chọn địa hình mới khi sinh thế giới, hoặc (2) Dữ liệu `Chunk` không tương thích/bị hỏng trong một file save cũ.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Khả năng Debug:** Với báo cáo này, chúng ta có một tài liệu tham chiếu rõ ràng về luồng dữ liệu, giúp việc xác định và sửa các lỗi logic phức tạp trong tương lai trở nên nhanh chóng và chính xác hơn.
*   **Độ ổn định:** Việc hiểu rõ các quy trình này là tiền đề để xây dựng các cơ chế xác thực dữ liệu (data validation) mạnh mẽ hơn, ngăn chặn các lỗi do dữ liệu không hợp lệ gây ra.

---

## **Bản cập nhật v0.2.58 - "Nền Móng Bất Hoại" (15/07/2025)**

*Tên mã: Unbreakable Foundation*

### 🌟 **Giới thiệu chung**

Bản cập nhật này tập trung vào việc gia cố "nền móng" của engine, sửa một lỗi crash nghiêm trọng trong quá trình sinh thế giới. Mục tiêu là đảm bảo engine có thể xử lý các tình huống dữ liệu không mong muốn một cách linh hoạt, ngăn chặn các lỗi runtime và giúp hệ thống trở nên ổn định hơn bao giờ hết.

### ✨ **Thay đổi chính & Phân tích**

1.  **Sửa lỗi Crash trong `generateChunkContent`:**
    *   **Phân tích:** Một lỗi `TypeError` nghiêm trọng đã xảy ra khi hàm `generateChunkContent` cố gắng đọc thuộc tính `descriptionTemplates` từ một `terrainTemplate` không tồn tại (`undefined`). Nguyên nhân gốc rễ là do hệ thống nhận được một giá trị `terrain` không hợp lệ, không có trong danh sách các template đã được định nghĩa.
    *   **Giải pháp:**
        *   **Thêm Guard Clause:** Một khối kiểm tra `if (!terrainTemplate)` đã được thêm vào đầu hàm. Nếu không tìm thấy template cho địa hình, hệ thống sẽ ghi lại lỗi chi tiết và trả về một chunk trống an toàn, ngăn chặn việc crash game.
        *   **Sử dụng Optional Chaining (`?.`):** Như một lớp phòng vệ thứ hai, tất cả các truy cập vào thuộc tính của `terrainTemplate` (như `items`, `enemies`, `structures`) đều được cập nhật để sử dụng optional chaining và fallback về một giá trị mặc định (mảng rỗng `[]`), đảm bảo mã nguồn không bao giờ bị lỗi do truy cập thuộc tính của `undefined`.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ ổn định:** Game sẽ không còn bị crash đột ngột trong quá trình khám phá thế giới do lỗi sinh chunk.
*   **Khả năng phục hồi:** Engine giờ đây "kiên cường" hơn, có khả năng tự xử lý các trường hợp dữ liệu không hợp lệ mà không làm gián đoạn trải nghiệm của người chơi.
*   **Dễ dàng Debug:** Việc bổ sung `logger.error` sẽ giúp chúng ta nhanh chóng xác định và sửa lỗi nếu có bất kỳ loại địa hình mới nào được thêm vào mà chưa có template tương ứng trong tương lai.

---

## **Bản cập nhật v0.2.57 - "Luồng Chảy Nhất Quán" (15/07/2025)**

*Tên mã: Consistent Flow*

### 🌟 **Giới thiệu chung**

Bản cập nhật này tập trung vào việc sửa một lỗi logic nghiêm trọng nhưng tinh vi trong luồng dữ liệu của engine. Lỗi này khiến cho trạng thái của người chơi (`playerStats`) không được cập nhật một cách nhất quán sau khi thực hiện các hành động, dẫn đến tình trạng "stale state" (trạng thái cũ) và các hành vi không mong muốn.

### ✨ **Thay đổi chính & Phân tích**

1.  **Sửa lỗi Logic cập nhật State trong `useActionHandlers`:**
    *   **Phân tích:** Các hàm xử lý hành động (ví dụ: `handleOfflineAttack`, `handleItemUse`) đã tính toán chính xác trạng thái mới của người chơi (máu mất, vật phẩm được sử dụng), nhưng lại **quên gọi hàm `setPlayerStats`** để thông báo cho React về sự thay đổi này. Thay vào đó, trạng thái mới chỉ được truyền cho một hàm phụ (`advanceGameTime`), khiến cho state chính của hook không bao giờ được cập nhật.
    *   **Giải pháp:** Đã thêm một lệnh gọi `setPlayerStats` vào cuối mỗi hàm xử lý hành động có liên quan. Điều này đảm bảo rằng sau mỗi hành động, trạng thái người chơi được cập nhật một cách đồng bộ trên toàn bộ ứng dụng, giải quyết triệt để vấn đề "stale state".

2.  **Dọn dẹp Dependencies trong `useCallback`:**
    *   **Phân tích:** Một số hook `useCallback` trong `useActionHandlers` có quá nhiều dependencies không cần thiết, làm tăng nguy cơ re-compute không cần thiết.
    *   **Giải pháp:** Đã rà soát và loại bỏ các dependencies không được sử dụng trực tiếp trong logic của các hàm callback, giúp tối ưu hóa hiệu suất và làm cho mã nguồn sạch sẽ hơn.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ ổn định:** Trạng thái của người chơi (HP, Stamina, Inventory) giờ đây sẽ được phản ánh chính xác ngay lập tức trên giao diện người dùng sau mỗi hành động.
*   **Độ tin cậy:** Loại bỏ một nguồn gây lỗi tiềm ẩn lớn, giúp các tính năng phức tạp hơn trong tương lai (như hiệu ứng trạng thái, buff/debuff) có thể được xây dựng trên một nền tảng logic vững chắc.

---

## **Bản cập nhật v0.2.56 - "Sự Nhất Quán" (15/07/2025)**

*Tên mã: Consistency*

### 🌟 **Giới thiệu chung**

Bản cập nhật này tập trung vào việc giải quyết một loạt lỗi TypeScript nghiêm trọng và tái cấu trúc các thành phần cốt lõi để đảm bảo sự nhất quán về kiểu dữ liệu trên toàn bộ ứng dụng. Đây là một bước "dọn dẹp" quan trọng, giúp mã nguồn trở nên sạch sẽ, dễ bảo trì và loại bỏ các lỗi tiềm ẩn do sự không đồng bộ giữa các định nghĩa.

### ✨ **Thay đổi chính & Phân tích**

1.  **Sửa lỗi Vòng lặp Render Vô hạn:**
    *   **Phân tích:** Một lỗi nghiêm trọng trong hook `useGameInitialization` đã được xác định, trong đó dependency `finalWorldSetup` không ổn định, gây ra vòng lặp render vô hạn và làm treo ứng dụng.
    *   **Giải pháp:** Áp dụng một phương pháp cập nhật state an toàn hơn bằng cách so sánh sâu giá trị của `worldSetup` trước khi gọi `setFinalWorldSetup`. Đồng thời, các hàm cập nhật state khác như `setPlayerStats` và `setWorld` đã được chuyển sang dạng functional update để tuân thủ thực tiễn tốt nhất của React.

2.  **Tái cấu trúc Toàn diện `ItemDefinition`:**
    *   **Phân tích:** Lỗi lớn nhất xuất phát từ việc `ItemDefinition` không nhất quán. Tên vật phẩm được dùng làm key, trong khi `name` và `description` chỉ là chuỗi đơn.
    *   **Giải pháp:** Đã thực hiện một cuộc "đại tu" toàn bộ các tệp vật phẩm (`/data/items/**`). Mỗi vật phẩm giờ đây sử dụng một `id` duy nhất làm key (ví dụ: `healing_herb`), và có thuộc tính `name` và `description` là các đối tượng đa ngôn ngữ chuẩn (`{ en: '...', vi: '...' }`). Điều này không chỉ sửa lỗi mà còn hoàn thiện hệ thống đa ngôn ngữ cho toàn bộ vật phẩm trong game.

3.  **Linh hoạt hóa `PlayerAttributesSchema`:**
    *   **Phân tích:** Các vật phẩm trang bị báo lỗi thiếu thuộc tính (`physicalDefense`, `magicalDefense`, v.v.) khi khai báo `attributes`.
    *   **Giải pháp:** Đã cập nhật `PlayerAttributesSchema` trong `definitions/base.ts`, thêm `.optional().default(0)` vào tất cả các thuộc tính. Giờ đây, khi định nghĩa `attributes` cho một vật phẩm, chúng ta chỉ cần khai báo những chỉ số mà nó thực sự thay đổi, giúp mã nguồn gọn gàng và linh hoạt hơn rất nhiều.

4.  **Sửa lỗi Logic trong các Hooks & Engine:**
    *   **Phân tích:** Một loạt lỗi logic và kiểu dữ liệu đã được phát hiện trong các hook (`useGameInitialization`, `useActionHandlers`) và engine (`generation.ts`, `offline.ts`). Các lỗi bao gồm: truy cập biến `null`, truyền sai tham số cho hàm, và sử dụng kiểu dữ liệu không chính xác.
    *   **Giải pháp:**
        *   Tách `useGameEffects` thành các hook con chuyên biệt (`useGameInitialization`, `useGameSaving`, v.v.) để tăng tính mô-đun hóa.
        *   Thêm các khối kiểm tra `if (stateToInitialize)` và `if (db)` để xử lý các trường hợp `null` một cách an toàn.
        *   Sửa lại toàn bộ các lời gọi hàm không đúng (ví dụ: `generateOfflineNarrative` giờ đã nhận đủ tham số `language`).
        *   Sửa lỗi logic trong các hàm của engine để chúng truy cập đúng thuộc tính và kiểu dữ liệu.

5.  **Chuẩn hóa Component UI với `getTranslatedText`:**
    *   **Phân tích:** Nhiều component UI (minimap, inventory, status popup) bị lỗi khi truyền trực tiếp một đối tượng `TranslatableString` vào hàm `t()` của i18n.
    *   **Giải pháp:** Đã áp dụng nhất quán hàm tiện ích `getTranslatedText` trên tất cả các component bị ảnh hưởng. Hàm này sẽ "bóc tách" chuỗi dịch phù hợp với ngôn ngữ hiện tại trước khi truyền vào hàm `t()`, giải quyết triệt để lỗi không tương thích kiểu.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ ổn định:** Game sẽ không còn gặp các lỗi runtime bất ngờ liên quan đến việc truy cập dữ liệu không nhất quán hoặc vòng lặp render vô hạn.
*   **Khả năng bảo trì:** Cấu trúc mã nguồn giờ đây sạch sẽ và rõ ràng hơn rất nhiều. Việc thêm vật phẩm mới, kẻ thù mới, hoặc các tính năng phức tạp trong tương lai sẽ trở nên dễ dàng và ít rủi ro hơn. Nền móng của chúng ta giờ đây thực sự vững chắc.

---

## **Bản cập nhật v0.2.55 - "Nền Móng Vững Chắc" (14/07/2025)**

*Tên mã: Solid Foundation*

### 🌟 **Giới thiệu chung**

Bản cập nhật này là một bước tiến quan trọng trong việc củng cố "xương sống" của Dreamland Engine. Chúng ta đã thực hiện một đợt rà soát và tái cấu trúc sâu rộng trên toàn bộ mã nguồn, tập trung vào việc sửa các lỗi type-safety nghiêm trọng, chuẩn hóa cấu trúc dữ liệu và dọn dẹp các module logic. Mục tiêu là tạo ra một nền tảng lập trình vững chắc, đáng tin cậy và sẵn sàng cho việc triển khai các tính năng lớn sắp tới.

### ✨ **Thay đổi chính & Phân tích**

1.  **Tái cấu trúc và Sửa lỗi Module Logic:**
    *   **Phân tích:** Các hàm logic quan trọng (`getEffectiveChunk`, `generateOfflineNarrative`, v.v.) đã được di chuyển về đúng "nhà" của chúng trong các module engine (`generation.ts`, `offline.ts`). Các lỗi `Module not found` và `is not a function` đã được giải quyết triệt để bằng cách sửa lại toàn bộ các đường dẫn `import` trong các hook (`use-action-handlers.ts`, `useWorldRendering.ts`).
    *   **Insight:** Đây là một bài học về "tính đóng gói" (Encapsulation). Mỗi module giờ đây chỉ chịu trách nhiệm cho một nhiệm vụ duy nhất và "xuất khẩu" (export) các chức năng của mình một cách rõ ràng, giúp mã nguồn trở nên cực kỳ dễ theo dõi và bảo trì.

2.  **Chuẩn hóa Kiểu Dữ liệu Toàn cục (`TranslatableString` & `ItemCategory`):**
    *   **Phân tích:** Các lỗi TypeScript liên quan đến kiểu dữ liệu không nhất quán đã được khắc phục. Kiểu `TranslatableString` đã được chuẩn hóa để hỗ trợ đa ngôn ngữ một cách an toàn. `ItemCategorySchema` cũng được mở rộng để bao gồm các loại hợp lý như `Equipment` và `Support`.
    *   **Insight:** Một hệ thống kiểu dữ liệu (type system) mạnh mẽ và nhất quán là "bản hợp đồng" đảm bảo các phần khác nhau của chương trình "giao tiếp" với nhau một cách chính xác, ngăn ngừa các lỗi tiềm ẩn.

3.  **Tài liệu hóa Mã nguồn với TSDoc:**
    *   **Thay đổi:** Đã bắt đầu tích hợp các khối comment TSDoc (`/** ... */`) vào toàn bộ các file quan trọng, từ các flow AI, component giao diện, cho đến các hook và engine logic. Script `docs:api` đã được thêm vào `package.json` để chuẩn bị cho việc tự động sinh tài liệu.
    *   **Insight:** Chúng ta đang chuyển đổi từ việc "viết code" sang "xây dựng một hệ thống bền vững". Tài liệu hóa mã nguồn là một khoản đầu tư cho tương lai, giúp việc bảo trì và mở rộng trở nên dễ dàng hơn gấp nhiều lần.

### 🗺️ **Lộ Trình Phát Triển Tiếp Theo: Kế hoạch Ba Giai Đoạn**

Với nền móng đã được củng cố, chúng ta đã sẵn sàng để xây dựng những "tòa tháp" tính năng mới. Lộ trình phát triển tiếp theo sẽ được chia thành các giai đoạn rõ ràng:

*   **GIAI ĐOẠN 1: Nâng cấp Hệ thống Thời gian (Ngày/Đêm & Buổi trong ngày)**
    *   **Mục tiêu:** Vượt ra ngoài 'ngày' và 'đêm' đơn giản, thêm các buổi `Bình minh` và `Hoàng hôn`, ảnh hưởng đến `lightLevel`, mood tường thuật, và có thể cả hành động của NPC/sinh vật.

*   **GIAI ĐOẠN 2: Hệ thống Phát triển Nhân vật (XP & Cấp độ cơ bản)**
    *   **Mục tiêu:** Xây dựng một hệ thống kinh nghiệm (XP) và cấp độ (Level) đơn giản. Người chơi sẽ nhận được XP khi hoàn thành nhiệm vụ, hạ gục kẻ thù, hoặc chế tạo vật phẩm khó. Lên cấp sẽ cải thiện các chỉ số cơ bản.

*   **GIAI ĐOẠN 3: Rà soát và Ưu tiên các Hệ thống cốt lõi khác (Đang triển khai)**
    *   **Mục tiêu:** Tiếp tục cải tiến và thêm chiều sâu cho các hệ thống hiện có, đặc biệt là:
        *   **Hệ thống Kể chuyện Offline Nâng cao:** Thêm nhiều mẫu câu chuyện và logic phức tạp hơn.
        *   **Hệ thống Hợp nhất (Fusion) Offline:** Xây dựng một bộ quy tắc logic offline để quyết định kết quả của việc hợp nhất vật phẩm, giảm sự phụ thuộc vào AI.
        *   **Hệ thống Tương tác NPC:** Mở rộng khả năng hội thoại và nhiệm vụ của NPC.

Cảm ơn vì đã đồng hành. Chúng ta đang tiến những bước vững chắc!

---

## **Bản cập nhật v0.2.1 - "La Bàn Của Người Kể Chuyện" (13/07 - 23:22)**

*Tên mã: The Storyteller's Compass*

### 🌟 **Giới thiệu chung**

Đây là một bản vá nhỏ nhưng cực kỳ quan trọng, tập trung vào việc "chỉnh đốn" lại cấu trúc nội bộ của engine. Giống như việc hiệu chỉnh lại la bàn, bản cập nhật này đảm bảo các "luồng thông tin" tường thuật của chúng ta đi đúng hướng, giải quyết các lỗi nghiêm trọng và giúp hệ thống hoạt động ổn định hơn.

### ✨ **Thay đổi chính & Phân tích**

#### 1. **Tái cấu trúc và sửa lỗi Import Engine Tường thuật Offline**
*   **Thay đổi:** Di chuyển các hàm cốt lõi của engine tường thuật offline (`generateOfflineNarrative`, `generateOfflineActionNarrative`, `handleSearchAction`) từ `generation.ts` về đúng "nhà" của chúng trong `offline.ts`. Đồng thời, tất cả các lệnh `import` trong `use-action-handlers.ts` đã được cập nhật để trỏ đến vị trí mới chính xác.
*   **Phân tích:**
    *   **Nguyên nhân:** Các hàm logic tường thuật bị đặt sai chỗ, dẫn đến lỗi runtime nghiêm trọng (`... is not a function`) do `use-action-handlers` không thể tìm thấy chúng.
    *   **Giải pháp:** Bằng việc di chuyển và sửa các đường dẫn import, chúng ta đã thực thi một sự "phân tách vai trò" (separation of concerns) rõ ràng hơn: `generation.ts` chỉ chịu trách nhiệm tạo ra cấu trúc thế giới, trong khi `offline.ts` quản lý logic về cách thế giới đó được mô tả và tương tác khi không có AI.
*   **Insight:** Đây là một bài học kinh điển về kiến trúc phần mềm. Một cấu trúc module rõ ràng không chỉ giúp code dễ đọc hơn mà còn là yếu tố sống còn để ngăn ngừa các lỗi logic khó tìm. "La bàn" của chúng ta giờ đã chỉ đúng hướng.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Người chơi sẽ không còn gặp phải lỗi game bị "đứng hình" hoặc không phản hồi khi thực hiện các hành động trong chế độ offline. Trải nghiệm giờ đây sẽ liền mạch và ổn định hơn.
*   **Hướng phát triển:** Với cấu trúc đã được dọn dẹp, việc mở rộng engine tường thuật offline (ví dụ: thêm các hành động offline phức tạp hơn) sẽ trở nên dễ dàng và an toàn hơn rất nhiều.

---

## **Bản cập nhật lớn - Version 0.2: "The Architect's Blueprint"**

*Tên mã: Kiến trúc sư Tái cấu trúc*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật nền tảng, tập trung vào việc tái cấu trúc sâu rộng "bộ não" của engine. Mặc dù người chơi có thể chưa thấy nhiều thay đổi trực tiếp về mặt "tính năng", nhưng những nâng cấp này là cực kỳ quan trọng, dọn đường cho vô số khả năng mới trong tương lai. Chúng ta đã thay thế nền móng cũ bằng một bộ khung kiến trúc mạnh mẽ, linh hoạt và sẵn sàng cho việc mở rộng.

### ✨ **Thay đổi chính & Phân tích**

#### 1. **Nâng cấp Engine Tường thuật Offline (Narrative Engine v2.0)**

*   **Thay đổi:** Loại bỏ hệ thống template tĩnh, đơn giản. Triển khai một engine tường thuật động hoàn toàn mới, dựa trên "Tâm trạng" (Mood).
*   **Phân tích:**
    *   Hàm `analyze_chunk_mood` giờ đây có thể "đọc vị" các chỉ số của một khu vực (độ nguy hiểm, ánh sáng, độ ẩm...) và chuyển đổi chúng thành các tag tâm trạng (ví dụ: `Danger`, `Mysterious`, `Lush`).
    *   Hệ thống sẽ lựa chọn các mẫu câu chuyện (`NarrativeTemplate`) dựa trên sự tương thích giữa tâm trạng của template và tâm trạng của khu vực, cũng như các điều kiện khác (thời gian, trạng thái người chơi).
*   **Insight:** Đây là bước chuyển mình từ một "con vẹt" đọc lại các câu có sẵn sang một "người kể chuyện" biết "cảm nhận" và mô tả môi trường một cách có hồn, ngay cả khi không có AI online.

#### 2. **Kiến trúc Đa ngôn ngữ "Hybrid" (i18n System Overhaul)**

*   **Thay đổi:** Triển khai một chiến lược đa ngôn ngữ kết hợp, cho phép hệ thống xử lý cả hai loại chuỗi văn bản:
    1.  **Translation Keys:** Dành cho các chuỗi UI tĩnh, được quản lý trong file ngôn ngữ.
    2.  **TranslatableString Objects (`{ en: '...', vi: '...' }`):** Dành cho các dữ liệu động trong game (tên vật phẩm, mô tả sự kiện) được định nghĩa trực tiếp trong file data.
*   **Phân tích:** Hàm helper `getTranslatedText` được tạo ra để xử lý linh hoạt cả hai trường hợp trên, đảm bảo code luôn gọn gàng và logic hiển thị văn bản được thống nhất.
*   **Insight:** Đây là một thay đổi CỰC KỲ QUAN TRỌNG, mở ra cánh cửa cho việc modding. Giờ đây, các modder có thể dễ dàng thêm vật phẩm, nhiệm vụ mới với đầy đủ mô tả đa ngôn ngữ mà không cần can thiệp vào hệ thống i18n phức tạp của game.

#### 3. **Chuẩn hóa Toàn bộ Dữ liệu Game**

*   **Thay đổi:** Tất cả các chỉ số môi trường trong game (`dangerLevel`, `lightLevel`, `moisture`...) đã được chuẩn hóa theo dải giá trị `0-100`.
*   **Phân tích:** Việc này giúp cho việc cân bằng game và thiết lập các điều kiện trở nên trực quan và nhất quán hơn rất nhiều. Các hàm logic như `analyze_chunk_mood` cũng đã được điều chỉnh để hoạt động chính xác với dải giá trị mới này.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Các mô tả môi trường trong chế độ offline giờ đây sẽ trở nên đa dạng, ít lặp lại và phù hợp với bối cảnh hơn rất nhiều. Người chơi sẽ cảm nhận được sự "thay đổi tâm trạng" của thế giới xung quanh họ.
*   **Hướng phát triển:** Với nền tảng kiến trúc mới, chúng ta đã sẵn sàng để xây dựng các hệ thống phức tạp hơn một cách dễ dàng, chẳng hạn như:
    *   Hệ thống sự kiện ngẫu nhiên có điều kiện phức tạp hơn.
    *   Logic tương tác với NPC sâu sắc hơn.
    *   Hệ thống modding mạnh mẽ.

### 🚀 **Kết luận & Bước tiếp theo**

Bản cập nhật "Kiến trúc sư" đã hoàn thành việc xây dựng lại "khung xương" và "hệ thần kinh" cho Dreamland Engine. Đây là một công việc thầm lặng nhưng là tiền đề cho mọi sự phát triển bùng nổ trong tương lai.

**Bước tiếp theo:** Tích hợp engine tường thuật mới này vào vòng lặp game chính và bắt đầu xây dựng các hệ thống con (như `build_entity_report`, `build_surrounding_peek`) để "thổi hồn" vào các mẫu câu chuyện.

Cảm ơn vì đã đồng hành! Chúng ta đang tạo ra một thứ thật đặc biệt.
