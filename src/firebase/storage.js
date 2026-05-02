// src/firebase/storage.js
// Firebase Storage 需要付費，改用 Base64 壓縮圖片存入 Firestore
// Firestore 單一文件上限 1MB，所以頭像壓到 50KB，聊天圖片壓到 200KB

/**
 * 將圖片壓縮並轉成 Base64 字串
 * @param {File} file - 圖片檔案
 * @param {number} maxDimension - 最大寬/高像素
 * @param {number} maxSizeKB - 壓縮目標大小（KB）
 */
export const compressImageToBase64 = (file, maxDimension = 400, maxSizeKB = 50) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = image;

        // 縮小到最大尺寸以內
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width  = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        // 逐步降低品質直到達到目標大小
        const targetBytes = maxSizeKB * 1024 * 1.37; // Base64 比原始大約 37%
        let quality = 0.8;
        let base64  = canvas.toDataURL("image/jpeg", quality);

        while (base64.length > targetBytes && quality > 0.1) {
          quality -= 0.05;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(base64);
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 壓縮頭像 — 最大 200x200px，目標 50KB
 * 這樣存入 Firestore 不會超過文件大小限制
 */
export const uploadProfilePhoto = async (file) => {
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be under 5MB.");
  return await compressImageToBase64(file, 200, 50);
};

/**
 * 壓縮聊天圖片 — 最大 800px，目標 200KB
 */
export const uploadChatImage = async (file) => {
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB.");
  const base64 = await compressImageToBase64(file, 800, 200);
  return { url: base64, path: null };
};

// fileToBase64 保留作為向下相容
export const fileToBase64 = (file, maxSizeKB = 200) =>
  compressImageToBase64(file, 800, maxSizeKB);

/** Base64 存在 Firestore，unsend 時文件整個更新，不需要另外刪除 */
export const deleteStoredImage = async () => {};
