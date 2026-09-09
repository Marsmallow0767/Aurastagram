# Aurastagram - Birebir Instagram Mobil Uygulaması

Instagram'ın birebir tasarımı, butonları, efektleri, alt gezinme çubuğu, hikayeleri, reels akışı, profil ve direkt mesajlaşma sistemine sahip, sahte kullanıcı olmadan gerçek e-posta/kullanıcı adı/şifre ile çalışan, kalıcı veritabanına sahip ve **küçük boyutlu bir APK'ya dönüştürülebilen** mobil uygulama.

---

## 🚀 Özellikler

- **Gerçek Kimlik Doğrulama:**
  - Sahte hesaplar yok. Ad Soyad, Kullanıcı Adı, E-posta ve Şifre ile gerçek kayıt sistemi.
  - Profil fotoğrafı seçimi (galeri veya kamera).
  - Kalıcı oturum: Sayfa yenilense veya uygulama kapatılsa bile oturum ve veriler korunur.
- **Instagram Arayüzü & Efektleri:**
  - **OLED Koyu Tema:** `#000000` ve `#121212` Instagram siyah teması.
  - **Hikayeler (Stories):** Degrade halka, süre çubuklu tam ekran hikaye izleme, yanıt yazma, kalp efekti ve 24 saatlik hikaye ekleme.
  - **Akış (Feed):** Fotoğrafa çift tıklayınca ekranda büyüyüp kaybolan kalp patlama animasyonu, beğenme, kaydetme, yorum çekmecesi, paylaşma.
  - **Instagram Canlı Filtreleri:** Clarendon, Gingham, Juno, Lark, Ludwig, Moon, Valencia, Slumber, Lo-Fi, X-Pro II ve Noir efektleri. Paylaşmadan önce canlı önizleme!
  - **5 Butonlu Alt Gezinme Barı:** Ana Sayfa, Keşfet, Oluştur (+), Reels, Profil.
  - **Keşfet (Explore):** Canlı kullanıcı/etiket araması ve Instagram tarzı 3 sütunlu mozaik ızgara.
  - **Reels:** Dikey kaydırılan tam ekran video/foto reels akışı, dönen ses plağı, beğeni ve yorumlar.
  - **Direkt Mesajlaşma (DM):** Diğer kullanıcılarla anlık sohbet, mesaj baloncukları ve görsel gönderme.
  - **Profil:** Gönderi/Takipçi/Takip sayıları, biyografi, web sitesi bağlantısı, öne çıkan hikaye halkaları, 3x3 gönderi ızgarası ve profili düzenleme.

---

## 📱 Çalıştırma ve Telefonda Kullanma

### 1. Geliştirici Modunda Başlatma
Proje dizininde terminali açıp şu komutu çalıştırın:
```bash
npm run dev
```
Terminalde bir yerel adres (örn. `http://localhost:5173`) ve **Network adresi** (örn. `http://192.168.1.XX:5173`) belirecektir.
Aynı Wi-Fi ağındaki telefonunuzdan Network adresine girerek uygulamayı birebir deneyimleyebilirsiniz.

### 2. Telefona Tek Tıkla Kurulum (PWA / Ana Ekrana Ekle)
Telefonunuzun tarayıcısında uygulamayı açtığınızda:
- **Chrome / Android:** Sağ üstteki 3 noktaya dokunun -> **"Ana ekrana ekle"** veya **"Uygulamayı yükle"** deyin.
- **Safari / iPhone:** Paylaş simgesine dokunun -> **"Ana Ekrana Ekle"** deyin.
Uygulama telefonunuza Instagram logosuyla, tarayıcı çubuğu olmadan **tam ekran yerel bir uygulama** olarak yüklenir.

---

## 📦 APK'ya Dönüştürme Yöntemleri (3-7 MB Ultra Hafif)

### Yöntem A: 1 Tıkla Bulutta APK Derleme (Önerilen - Kurulum Gerektirmez)
Bu projede hazır bir GitHub Actions iş akışı (`.github/workflows/build-apk.yml`) bulunmaktadır:
1. Projeyi kendi GitHub hesabınıza yükleyin (`git push`).
2. GitHub'da **Actions** sekmesine gidin -> **Build Android APK** akışını seçin -> **Run workflow** deyin.
3. 2 dakika sonra derlenen hazır `.apk` dosyasını (Artifacts altından) doğrudan telefonunuza indirin!

### Yöntem B: Yerel Android Studio ile APK Alma
Eğer bilgisayarınızda Android Studio kuruluysa:
1. Web derlemesini Android projesine senkronize edin:
   ```bash
   npm run build:apk
   ```
2. Android Studio'yu açın:
   ```bash
   npm run open:android
   ```
3. Android Studio üst menüsünden **Build > Build Bundle(s) / APK(s) > Build APK(s)** seçeneğine tıklayın.
   - APK çıktısı: `android/app/build/outputs/apk/debug/app-debug.apk` konumunda oluşur.
