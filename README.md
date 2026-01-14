#  Gazistat Rapor Oluşturucu Kullanım Kılavuzu

Hoş geldiniz! Bu kılavuz, Gazistat Rapor Oluşturucu'yu kullanarak nasıl rapor hazırlayabileceğinizi adım adım açıklamaktadır.

---

##  Uygulama Panelleri (Şema)

Uygulama arayüzü, iş akışınızı kolaylaştırmak için 4 ana bölüme ayrılmıştır:

1.  **Üst Çubuk (Header)**: Raporu kaydetme, yayınlama ve dışa aktarma gibi ana kontrollerin bulunduğu alandır.
2.  **Sol Panel (Araç Kutusu)**: Raporunuza ekleyebileceğiniz bileşenlerin (grafik, metin, görsel vb.) bulunduğu kütüphanedir.
3.  **Orta Alan (Çizim Alanı)**: Raporunuzun görsel olarak tasarlandığı, A4 formatında sayfalardan oluşan ana çalışma alanıdır.
4.  **Sağ Panel (Müfettiş)**: Seçtiğiniz bir bileşenin içeriğini (yazısını, rengini, verisini) özelleştirebileceğiniz ayarlar panelidir.

---

##  Temel Özellikler ve Butonlar

###  Rapor Tasarlama
- **Bileşen Ekleme**: Sol paneldeki bileşenleri (Başlık, Grafik, Metin vb.) farenizle tutarak orta alandaki beyaz sayfalara sürükleyip bırakın.
- **Düzenleme**: Sayfa üzerindeki herhangi bir bileşene tıkladığınızda, sağ panelde o bileşene özel ayarlar açılır. Buradan metni değiştirebilir veya grafiğin verilerini güncelleyebilirsiniz.
- **Sıralama**: Bileşenleri sayfa içinde yukarı veya aşağı sürükleyerek yerlerini değiştirebilirsiniz.
- **Sayfa Yönetimi**: En alttaki **"Yeni Sayfa Ekle"** butonuyla raporunuza yeni sayfalar ekleyebilirsiniz. Sayfaların yanındaki çöp kutusu simgesiyle sayfaları silebilirsiniz.

###  Kayıt ve Paylaşım (Üst Bar)
- **Başlık Girişi**: Sol üst taraftaki metin kutusuna raporunuzun adını yazın.
- **Buluta Kaydet**: Raporu sistemde saklamak için **"Buluta Kaydet"** butonunu kullanın.
- **Yayınla (Web)**: Raporunuzu canlı bir web sayfası olarak paylaşmak için benzersiz bir isim (slug) verin ve yayınlayın.
- **PDF Yayınla**: Raporunuzu anında profesyonel bir PDF dosyası olarak indirin.
- **Dışa/İçe Aktar**: Raporunuzu bilgisayarınıza dosya olarak kaydedebilir (JSON/Word) veya daha önce kaydettiğiniz bir raporu tekrar yükleyebilirsiniz.

---

##  İpuçları
- **Hızlı Silme**: Bir bileşeni silmek için onu tutup sayfanın en altına doğru sürükleyin (Silme Alanı).
- **Ölçekleme**: Sağ alt köşedeki **+% / -%** butonlarını kullanarak çizim alanını yakınlaştırıp uzaklaştırabilirsiniz.
- **Erişim**: Editöre girmek için yönetici hesabınızla giriş yapmanız gerekmektedir. Raporlarınız yayınlandığında, başkaları tarafından sadece görüntülenebilir (düzenlenemez).

---

##  Teknik Kurulum (Geliştiriciler İçin)

1.  `npm install` komutuyla bağımlılıkları yükleyin.
2.  `.env.local` dosyasına Supabase URL ve Key bilgilerinizi ekleyin.
3.  `npm run dev` ile sistemi başlatın.

---
*Gazi Üniversitesi İstatistik Bölümü için geliştirilmiştir.*
