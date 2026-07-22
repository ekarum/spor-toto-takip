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


V8.0.0:
- Her maç için yüklenen kolonlardaki 1 / X / 2 seçim adetleri gösterilir.
- Her seçimin yüzde oranı gösterilir.
- Dağılım Excel yüklenince ve hafta değiştirilince otomatik hesaplanır.


V8.2.0: Analiz Merkezi canlı hale getirildi. Tüm/Kalan kolon modu, başlangıç-kalan-elenen sayaçları, kalan oranı, son sonuç etkisi ve yalnızca devam eden kolonlara göre dinamik 1/X/2 analizi eklendi.


V8.2.0 YENİLİKLERİ
- Canlı kalan ve elenen kolon sayaçları animasyonlu çalışır.
- Son girilen sonucun etkisi ayrı bir bantta gösterilir.
- Her maç için Çok Güçlü / Güçlü / Orta / Dengeli / Çok Riskli güven etiketi bulunur.
- Canlı yüzdeler başlangıç yüzdeleriyle karşılaştırılır.
- Isı haritasında başlangıç seviyesi beyaz işaretle, değişim ise puan farkıyla gösterilir.
- Kolon arama özelliği eklenmemiştir.


V9.1.0 KALAN KOLON SENARYO MOTORU
- Kalan maçlar için birbirinden farklı 15 bilme senaryoları oluşturulur.
- Aynı bekleyen sonuç dizisine sahip kolonlar tek senaryoda birleştirilir.
- Her senaryonun kaç kolonda bulunduğu ve toplam içindeki payı gösterilir.
- Her bekleyen maçta 1, X veya 2 gelirse kaç kolonun 15 Devam kalacağı hesaplanır.
- Sonuç seçildikçe veya geri alındıkça senaryolar anlık yenilenir.


V9.1.1: Senaryo Motoru stil dosyası önbellek sorunu düzeltildi; kartlar, sayaçlar ve 1/X/2 sonuç kutuları daha okunaklı hale getirildi.


V10.0.0 Akıllı Karar Analizi
- Canlı kalan kolonlardan kritik maç, avantajlı sonuç ve güçlü yol analizi üretir.
- Dış maç tahmini yapmaz; sadece yüklenen kolon verisini yorumlar.
- En güçlü üç 15 bilme senaryosunu öne çıkarır.
