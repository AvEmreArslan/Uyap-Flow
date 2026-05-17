# Uyap Flow — Toplu Evrak İndirici

**Uyap Flow**, UYAP Avukat Portal'da bir dosyadaki **tüm evrakları toplu olarak** indiren bir tarayıcı eklentisidir. Chromium tabanlı tarayıcılar (Chrome, Edge, Brave, Opera) ile uyumludur.

## Özellikler — v2.0 ile Eklenenler

### Temel İndirme
- **UDF / PDF formatı seçimi** — PDF modu, UYAP'ın önizleyici servisinin sunduğu PDF'i birebir yakalar (kalite kaybı yok).
- **Anlamlı dosya isimleri** — `2026-05-07_Duruşma-Zaptı_3.Celse_9690.pdf` gibi okunabilir formatta.
- **Otomatik alt klasör yapısı** — Tüm dosyalar `Dosya_2025-849_İstanbul-Anadolu-37/` gibi otomatik klasörlerde toplanır.
- **Tek ZIP arşivi** — Tüm evrakları tek bir ZIP dosyasında topla, kolay paylaş.

### Filtreler (Opsiyonel)
Hiçbir filtre seçilmezse **tüm evraklar** indirilir. Opsiyonel olarak:
- **Evrak seçim modu** — Tarama sonrası liste açılır, checkbox ile istediklerini seçersin.
- **Tarih aralığı filtresi** — Sadece belirli tarih aralığındaki evraklar.
- **Tür filtresi** — Sadece "Duruşma Zaptı" + "Kararlar" gibi seçili türler.
- **Anahtar kelime filtresi** — Adında/açıklamasında belirli kelime geçenler (örn. "bilirkişi").
- **Sadece yeni evraklar** — Önceki indirmeden sonraki evraklar (her dosya için son indirme zamanı hatırlanır).

### Önizleme
- **Önizleme paneli** — Tarama sonrası tüm evraklar listede görünür; üzerine tıklayarak UYAP'ta önizleyebilirsin. Filtreler uygulandığında dışarıda kalanlar sönükleştirilir.

### Çoklu Dosya
- **Çoklu dosya kuyruğu** — Birden fazla dosyayı sıraya al, otomatik olarak her birinin evraklarını sırayla indir. İki yöntem:
  - Açık olan dosyayı tek tıkla kuyruğa ekle.
  - "Dosya Sorgula" sayfasındaki tüm sonuçları toplu olarak kuyruğa ekle.

### Çıktı ve Raporlama
- **Excel/CSV evrak listesi** — Tüm evrakların metadata'sını (tarih, tür, açıklama, gönderen vb.) UTF-8 BOM'lu CSV olarak çıkar. Excel'de direkt açılır.
- **Detaylı log export** — Tüm indirme oturumunun log'unu zaman damgalı `.txt` olarak indir.

### Bildirim ve İzleme
- **Tarayıcı bildirimi** — İşlem tamamlandığında masaüstü bildirimi.
- **Tarayıcı başlığında ilerleme** — Sekme başlığı `[25%] PDF yakalanıyor [12/50] — Uyap Flow` gibi güncellenir; başka sekmedeyken bile durumu görebilirsin.

### Diğer
- Canlı log paneli (renkli, zaman damgalı).
- İlerleme çubuğu.
- Her indirme arası bekleme süresi ayarlanabilir.
- Tek tek indirme yaptığı için tarayıcı "çoklu indirme izni" diyaloğunu açmaz.

## Kurulum

> Eklenti mağazada yayınlanmadığı için **Geliştirici Modu** ile yükleyeceksin. Bu, kendi eklentilerini kullanmak için tarayıcıların normal sunduğu güvenli bir yöntemdir.

### Adım 1: Tarayıcıda Eklentiler sayfasını aç
- **Edge**: `edge://extensions`
- **Chrome**: `chrome://extensions`
- **Brave**: `brave://extensions`
- **Opera**: `opera://extensions`

### Adım 2: Geliştirici modunu aç
Sayfanın üst veya sol alt köşesinde **"Geliştirici Modu"** anahtarını AÇ.

### Adım 3: Eklentiyi yükle
**"Paketlenmemiş yükle"** butonuna bas ve şu klasörü seç:

```
C:\Users\avemr\OneDrive\Masaüstü\UYAP Toplu Dosya İndirme\extension
```

### Adım 4: Hazır
Liste'de **"Uyap Flow — Toplu Evrak İndirici"** olarak görünecek.

## İlk Kullanım Öncesi Tarayıcı Ayarı (ÖNEMLİ)

Tarayıcının her dosya için "Kaydet" penceresi açmaması için:

- **Edge**: `edge://settings/downloads` → "İndirmeden önce her dosyanın nereye kaydedileceğini sor" → **KAPAT**
- **Chrome**: `chrome://settings/downloads` → "Ask where to save each file before downloading" → **KAPAT**

Bu ayarı kapatmazsan, ZIP olmayan modda her evrak için pencere açılır.

## Kullanım

### Senaryo 1: Bir Dosyadaki Tüm Evrakları İndirme (Varsayılan)
1. UYAP'a giriş yap → bir dosya aç → **Evrak** sekmesi.
2. Sol alttaki **Uyap Flow** yüzen butonuna tıkla.
3. **"Genel Ayarlar"**'dan format seç (UDF veya PDF).
4. (İsteğe bağlı) **"Çıktı Seçenekleri"** altında ZIP arşivi veya CSV listesi seçeneklerini ayarla.
5. **"İndirmeyi Başlat"** butonuna bas.

### Senaryo 2: Belirli Türde / Tarihte Evrakları İndirme
1. **"Tara"** butonuna bas.
2. **"Filtreler"** bölümünü aç.
3. İstediğin filtreyi açıp ayarla:
   - Tarih aralığı → tarih seç.
   - Tür filtresi → istediğin türleri tıklayarak seç (yeşil chip).
   - Anahtar kelime → metin yaz.
4. **"Önizleme"** bölümünde filtrelenmiş listeyi gör.
5. **"İndirmeyi Başlat"** butonuna bas.

### Senaryo 3: Birden Fazla Dosyadan Toplu İndirme
1. **"Dosya Sorgula"** sayfasında müvekkillerini listele.
2. **Uyap Flow** panelini aç (sol alttaki yüzen buton).
3. **"Gelişmiş"** → **"Çoklu dosya kuyruğu"** AÇ.
4. **"+ Listedeki Tüm Dosyaları Ekle"** butonuna bas — tablodaki tüm dosyalar kuyruğa eklenir.
5. **"İndirmeyi Başlat"** — eklenti her dosyayı sırayla açıp evraklarını indirir.

### Senaryo 4: Sadece Yeni Eklenen Evrakları Çekme
1. Dosyayı aç.
2. **"Filtreler"** → **"Sadece yeni evraklar"** AÇ.
3. Panel sana son indirme tarihini gösterir.
4. **"İndirmeyi Başlat"** — sadece son indirmeden sonraki yeni evraklar inilir.

### Senaryo 5: Sadece Bazı Evrakları Seçerek İndirme
1. **"Tara"** butonuna bas.
2. **"Filtreler"** → **"Evrak seçim modu"** AÇ.
3. **"Önizleme"** bölümünde her satırın yanına checkbox gelir.
4. İstediklerini seç (veya **"Tümünü Seç"** / **"Hiçbirini Seçme"** kullan).
5. **"İndirmeyi Başlat"**.

## Dosya İsimlendirme Mantığı

```
[OnaylandığıTarih]_[Tür]_[Açıklama]_[BirimEvrakNo].[udf|pdf]
```

Otomatik alt klasör açıksa (varsayılan):

```
2025-849_İstanbul-Anadolu-37-Asliye/2026-05-07_Duruşma-Zaptı_3.Celse_9690.pdf
```

## CSV / Excel Listesi

**"Çıktı Seçenekleri"** → **"CSV / Excel Listesi İndir"** butonuyla şu sütunları içeren bir tablo oluşur:

| Sıra | Tarih | Tür | Açıklama | Birim Evrak No | Gönderen | Gönderen Dosya No | Tip | Sisteme Gönderildiği |
|------|-------|-----|----------|----------------|----------|-------------------|-----|---------------------|

UTF-8 BOM ile çıkar; Excel'de **çift tıkla aç**, Türkçe karakterler bozulmaz.

## Sorun Giderme

| Sorun | Çözüm |
| ----- | ----- |
| Buton görünmüyor | Eklentinin AÇIK olduğunu kontrol et; sayfayı F5 ile yenile. |
| "Hiç evrak bulunamadı" | Sol panelde **"Tüm Evrak"** klasörüne tıkladığından emin ol; 2-3 sn bekle ve tekrar "Tara". |
| "URL yakalanamadı" | Bekleme süresini artır (1500-2500 ms). |
| PDF modunda "PDF yakalanamadı" | Daha önce manuel olarak açılan evraklar önbellekten gelebilir. Sayfayı F5 ile yenile, tekrar dene. |
| Bazı dosyalar 0 KB iniyor | Oturum sona ermiş olabilir; UYAP'a tekrar giriş yap. |
| HTTP 403 / 401 | Oturum süresi doldu, yeniden giriş yap. |
| ZIP indirilmiyor | Çok büyük arşiv olabilir; RAM kullanımını izle. Filtreyle veya UDF modunda dene. |
| Çoklu dosya modunda modal açılmıyor | Dosya Sorgula sayfasında olduğundan emin ol; filtreler kullanılıyorsa "Sorgula" butonuna basıp listeyi yenile. |
| Bildirim gelmiyor | Tarayıcı bildirim iznini ver. `edge://settings/content/notifications` adresinden kontrol et. |

## Klasör Yapısı

```
UYAP Toplu Dosya İndirme/
├── README.md                  (bu dosya)
└── extension/
    ├── manifest.json          (Manifest V3)
    ├── main.js                (UI + indirme + filtreler + ZIP + CSV + kuyruk)
    └── lib/
        └── jszip.min.js       (ZIP arşivleri için, JSZip v3.10.1)
```

## Güncelleme

`main.js` veya `manifest.json` değiştirdiysen:
1. `edge://extensions` aç.
2. Eklentinin altındaki **🔄 Yenile** butonuna bas.
3. UYAP sayfasını F5 ile yenile.

## Güvenlik

- Eklenti sadece `https://avukat.uyap.gov.tr/*` adresinde çalışır.
- Hiçbir veri dışarı gönderilmez; tüm işlem yerel olarak senin tarayıcında olur.
- Çerez veya oturum bilgileri ASLA kaydedilmez/gönderilmez.
- Yalnızca **`localStorage`** kullanılır: "Sadece yeni evraklar" özelliği için, her dosya için son indirme zaman damgası.
- Kaynak kodu açık, `extension/main.js` ve `extension/manifest.json` dosyalarını inceleyebilirsin.

## Sürüm Geçmişi

- **v2.0.0** (2026-05-17)
  - **Yenilenen UI**: Collapsible bölümler (Genel / Filtreler / Çıktı / Gelişmiş / Önizleme).
  - **Önizleme paneli**: Tarama sonrası tüm evrakları listele + UYAP'ta önizle butonu.
  - **Evrak seçim modu**: Checkbox ile istediklerini seç.
  - **Filtreler**: Tarih, tür, anahtar kelime, "sadece yeni evraklar".
  - **Otomatik alt klasör yapısı** (varsayılan açık).
  - **Tek ZIP arşivi** olarak indirme.
  - **CSV/Excel evrak listesi export**.
  - **Çoklu dosya kuyruğu**: Birden fazla dosyayı sırayla işle.
  - **Tarayıcı bildirimi** ve **başlık ilerleme göstergesi**.
  - **Log export** (.txt olarak).
- **v1.1.0** (2026-05-17) — PDF modu eklendi.
- **v1.0.0** (2026-05-17) — İlk sürüm. UDF formatında toplu indirme.
