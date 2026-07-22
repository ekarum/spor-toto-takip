KARUM TOTO V7.0 — TELEFON/BİLGİSAYAR ANLIK SENKRONİZASYON

1) Supabase panelinde SQL Editor bölümünü aç.
2) supabase-kurulum.sql dosyasının tamamını yapıştırıp Run düğmesine bas.
3) Authentication > Providers > Email bölümünde Email sağlayıcısının açık olduğundan emin ol.
4) Bu klasörün içindeki TÜM dosyaları GitHub deposunun ana dizinine yükle.
5) Siteyi aç, Hesap düğmesine bas ve ilk kez Kayıt Ol.
6) Supabase e-posta onayı açıksa gelen bağlantıyı onayla, sonra aynı hesapla iki cihazda giriş yap.
7) Excel'i yalnızca bir cihazda yükle. Hafta ve kolonlar buluta kaydedilir.
8) Diğer cihaz aynı hesapla giriş yapınca hafta listesinden otomatik açılır.
9) 1/X/2 seçimi yaklaşık bir saniye içinde diğer cihazda görünür.

Her hafta yeni Excel yüklediğinde ayrı bir hafta kaydı oluşur. Aynı dosya/hafta tekrar yüklenirse o haftanın maç ve kolon verileri güncellenir.

GÜVENLİK
- Publishable key tarayıcı için kullanılabilir.
- Secret/service_role anahtarını hiçbir dosyaya koyma.
- RLS kuralları sayesinde her hesap yalnızca kendi haftalarını görür.


V7.1 yenilikleri:
- Kalan Kolon adı 15 Devam olarak değiştirildi.
- 15, 14, 13, 12 ve 11 ve Altı kartları tıklanabilir yapıldı.
- Her kategori kendi kolon listesini açar.
- Kolon numarası araması kaldırıldı.
- Hatalı tahminler kolon listesinde işaretlenir.

V7.1.4: Takip Paneli'nde Lig satırı desteklenir. Maç kartlarında lig adı takım adının altında gösterilir.

V7.2.0: Excel yüklemedeki matchLeagues tanımsız hatası düzeltildi. Lig satırı güvenli biçimde okunur, eski haftalar boş liglerle çalışır ve ligler bulut senkronizasyonuna dahil edilir.


V7.3.1:
- Her maç için yüklenen kolonlardaki 1 / X / 2 seçim adetleri gösterilir.
- Her seçimin yüzde oranı gösterilir.
- Dağılım Excel yüklenince ve hafta değiştirilince otomatik hesaplanır.
