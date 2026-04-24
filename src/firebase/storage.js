// src/firebase/storage.js
// ⚠️ Firebase Storage 需要付費，所以改用 Base64 將圖片存入 Firestore

/**
 * 將圖片檔案壓縮並轉成 Base64 字串
 */
export const fileToBase64 = (file, maxSizeKB = 300) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.8;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        while (base64.length > maxSizeKB * 1024 * 1.37 && quality > 0.2) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/** 上傳聊天圖片 → 回傳 base64，由 sendMessage 存入 Firestore */
export const uploadChatImage = async (file) => {
  if (file.size > 5 * 1024 * 1024) throw new Error("圖片不能超過 5MB");
  const base64 = await fileToBase64(file, 300);
  return { url: base64, path: null };
};

/** 上傳頭像 → 回傳 base64 */
export const uploadProfilePhoto = async (file) => {
  if (file.size > 3 * 1024 * 1024) throw new Error("頭像不能超過 3MB");
  return await fileToBase64(file, 150);
};

/** Base64 不需要另外刪除（unsend 訊息時 Firestore 文件整個更新） */
export const deleteStoredImage = async () => {};
