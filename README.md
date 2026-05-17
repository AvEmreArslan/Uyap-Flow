# Uyap Flow — Toplu Evrak İndirici

**Güncel sürüm: 2.3.7** · `extension/manifest.json` içindeki `version` alanı esas alınır.

**Uyap Flow**, UYAP Avukat Portal’da bir dosyadaki evrakları **toplu** indirmenizi, filtrelemenizi ve düzenli klasörlere kaydetmenizi sağlayan bir tarayıcı eklentisidir. Chromium tabanlı tarayıcılar (Chrome, Edge, Brave, Opera) ile uyumludur.

> **Resmi ürün değildir** — UYAP ile bağlantılı veya onaylı bir kurum yazılımı değildir; portal arayüzüne eklenen yardımcı bir eklentidir.

---

## Tüm özellikler (güncel)

### İndirme ve format
- **UDF ve PDF modu** — UDF: orijinal evrak; PDF: önizleyicide üretilen PDF’in yakalanması (birebir kalite).
- **Tek tek indirme veya ZIP arşivi** — Tüm evrakları tek `.zip` içinde toplama (JSZip).
- **Tek birleşik PDF** — PDF modunda, seçili/filtrelenmiş evrakları tek PDF’te birleştirme (pdf-lib). ZIP ile birlikte de kullanılabilir (ikisi birden üretilebilir).
- **Anlamlı dosya adları** — Tarih, tür, açıklama, birim evrak no vb. ile otomatik isimlendirme.
- **Özel dosya adı şablonu** — `{tarih}`, `{tur}`, `{aciklama}`, `{birim}`, `{sira}`, `{gonderen}`, `{tip}` yer tutucuları.

### Klasör yapısı
- **Otomatik üst klasör** — Dosya esası ve mahkeme bilgisinden indirme kökü (ör. `2026-299_MahkemeAdı/`).
- **Türe göre kategorize** — Açıkken önce UYAP sol **ağaçtaki** klasör yolunu yansıtır (ör. Tebligatlar / alt klasör). Ağaçtan okunamazsa **numaralı tür klasörleri** (`01_Durusma_Zaptlari` vb.) kullanılır.
- **ZIP / indirme yolu** — Alt klasörler indirme veya arşiv içi yolda korunur.

### Tarama ve liste
- **Tara** — Evrak listesini okur; isteğe bağlı **ek-evrakları otomatik aç** (ağaç genişletme).
- **Tekilleştirme** — Aynı evrakın listede birden fazla satırda görünmesi (aynı birim no + tarih) tek kayda indirilir; gereksiz çift indirme azaltılır.
- **İndirme arası bekleme (ms)** — Sunucu ve arayüz yükünü dengelemek için ayarlanabilir.

### Filtreler
- **Tarih aralığı**, **tür** (çoklu chip), **anahtar kelime** (`Ctrl+F` benzeri içerik).
- **Sadece yeni evraklar** — Son başarılı indirmeden sonrakiler (dosya bazında `localStorage` ile hatırlanır).
- **Evrak seçim modu** — Önizlemede checkbox; yalnızca seçileni veya filtreyi indir.
- **Filtreleri uygula / sıfırla**.

### Önizleme ve notlar
- **Önizleme listesi** — Tüm taranan evraklar; filtre dışı kalanlar sönük; **önizle** ile UYAP’ta açma.
- **Not ve etiketler** — Evrak bazında not; tooltip’te özet.
- **Tümünü seç / hiçbirini seçme** (seçim modunda).

### Çıktı ve raporlama
- **CSV / Excel listesi** — Metadata sütunları (tarih, tür, açıklama, birim no, gönderen, tip, sisteme gönderilme vb.); UTF-8 BOM.
- **Log kaydet** — Oturum günlüğünü `.txt` olarak indir.
- **Canlı log** ve **ilerleme çubuğu** panelde.

### Arayüz ve kısayollar
- **Yüzen buton (FAB)** — Sürüklenebilir konum; varsayılan sol alt.
- **Panel** — Sabitleme (pin), kapatma; komut paleti ipucu.
- **Komut paleti** — `Ctrl+K` (arama, komutlar ve taranan evrak listesine hızlı erişim).
- **Klavye** — örn. `Ctrl+Shift+U` panel, `Ctrl+Shift+S` tara, `Ctrl+Shift+D` indir (odak uygun olduğunda).

### Gelişmiş ve kuyruk
- **Çoklu dosya kuyruğu** — Açık dosyayı veya **Dosya Sorgula** tablosundaki dosyaları sıraya ekleme; her dosyada tarama + indirme.
- **Tarayıcı bildirimi** — İşlem bitince (izin gerekir).
- **Sekme başlığında ilerleme** — Örn. `[25%] … — Uyap Flow`.

### PTT tebligat ve metin seçimi (UYAP sayfasında)
- Sayfada metin seçildiğinde **küçük araç çubuğu**: barkod algılanırsa **PTT’de sorgula** (yeni sekmede); ayrıca panoya kopyala, uygun metinle **UYAP Karar Arama** yeni sekme.
- Komut paletinden **PTT’de tebligat sorgula** (barkod sorulur).
- **`ptt-helper.js`** — `gonderitakip.ptt.gov.tr` üzerinde barkodu hash / oturum ile doldurup sorguya yardım (manifest’te ayrı içerik betiği).

### PDF meta (birleşik PDF)
- Oluşturulan birleşik PDF’te başlık, üretici bilgisi **Uyap Flow** ile işlenebilir.

---

## Kurulum

> Mağaza dışı yükleme için **Geliştirici modu** kullanılır.

### Adım 1: Eklentiler
- **Edge**: `edge://extensions`
- **Chrome**: `chrome://extensions`
- **Brave**: `brave://extensions`
- **Opera**: `opera://extensions`

### Adım 2: Geliştirici modu
Açık konuma getir.

### Adım 3: Paketlenmemiş yükle
Bu depodaki **`extension`** klasörünü seç.

### Adım 4: Hazır
Listedeki ad: **Uyap Flow — Toplu Evrak İndirici**.

## İlk kullanım (indirme ayarı)

ZIP kullanmıyorsan tarayıcının her dosyada “nereye kaydedilsin” sormaması iyi olur:

- **Edge**: `edge://settings/downloads` → “İndirmeden önce her dosyanın nereye kaydedileceğini sor” → **Kapalı**
- **Chrome**: `chrome://settings/downloads` → “Ask where to save each file before downloading” → **Kapalı**

## Kullanım özet senaryoları

### Tek dosya — tüm evraklar
1. UYAP’ta dosyayı aç → **Evrak**.
2. Sol alttaki **Uyap Flow** butonuna tıkla.
3. Format (UDF/PDF), ZIP / birleşik PDF / klasör seçeneklerini ayarla.
4. **İndirmeyi Başlat**.

### Filtre + önizleme
1. **Tara** → **Filtreler**’den kriterleri aç.
2. **Önizleme**’de listeyi kontrol et → **İndirmeyi Başlat**.

### Sadece seçilen evraklar
1. **Tara** → **Evrak seçim modu** açık.
2. Önizlemede işaretle → **İndirmeyi Başlat**.

### Çoklu dosya kuyruğu
1. **Dosya Sorgula** veya açık dosya ile **Gelişmiş** → kuyruk açık.
2. Dosyaları ekle → **İndirmeyi Başlat**.

### Sadece yeni evraklar
**Filtreler** → **Sadece yeni evraklar**; son indirmeden sonrakiler indirilir.

## Dosya isimlendirme (özet)

```
[OnayTarihi]_[Tür]_[Açıklama]_[BirimEvrakNo].udf|pdf
```

Üst klasör + (isteğe bağlı) kategorize alt yolu açıksa örnek:

```
2025-849_Mahkeme.../Tebligatlar_AltKlasor/2026-05-07_....pdf
```

## CSV sütunları

| Sıra | Tarih | Tür | Açıklama | Birim Evrak No | Gönderen | Gönderen Dosya No | Tip | Sisteme Gönderildiği |

UTF-8 BOM; Excel’de doğrudan açılabilir.

## Sorun giderme (kısa)

| Sorun | Çözüm |
| ----- | ----- |
| Buton yok | Eklenti açık mı, sayfa `avukat.uyap.gov.tr` mi; F5. |
| Evrak yok | Sol ağaçta **Tüm Evrak** vb.; birkaç saniye bekleyip **Tara**. |
| URL yakalanamadı (UDF) | Beklemeyi artır (ms). |
| PDF yakalanamadı | Sayfayı yenile, tekrar dene. |
| Oturum / 401-403 | Yeniden giriş. |
| Çoklu indirme penceresi | İndirme “nereye kaydet” ayarını kapat; veya ZIP kullan. |
| Bildirim yok | Site bildirim izni. |

## Klasör yapısı (depo)

```
extension/
├── manifest.json
├── main.js                 (UYAP: UI, indirme, filtreler, palet, notlar, PTT yönlendirme)
├── ptt-helper.js           (PTT takip sayfaları: barkod yardımı)
└── lib/
    ├── jszip.min.js        (ZIP)
    └── pdf-lib.min.js      (PDF birleştirme)
```

## Güncelleme

`main.js`, `manifest.json` veya diğer dosyalar değiştiyse: eklentiler sayfasında **Yenile** → UYAP sekmesinde **F5**.

## Güvenlik ve veri

- **UYAP** script’i yalnızca `https://avukat.uyap.gov.tr/*`.
- **PTT yardımı** `https://gonderitakip.ptt.gov.tr/*` ve `https://*.ptt.gov.tr/*` (manifest ile uyumlu).
- İndirme ve işlemler tarayıcıda; üçüncü taraf sunucuya özel veri gönderilmez.
- **`localStorage`**: pin, FAB konumu, notlar, şablon, son indirme bilgisi (“sadece yeni”), komutla ilgili kalıcı tercihler olabilir.
- Oturum çerezi tarayıcınızın normal UYAP oturumuyla aynıdır; eklenti şifre kaydetmez.

## Sürüm notları (özet)

### v2.3.7
- Marka adı **Uyap Flow** (manifest, panel, bildirim, PDF üretici, PTT rozet, README).

### v2.3.x (önceki özellikler)
- UYAP ağaç klasör yolu ile kategorize; tarama **tekilleştirme**; PDF birleştirme; `pdf-lib`; komut paleti ve modern panel; sürüklenebilir FAB; PTT / seçim araç çubuğu / karar arama entegrasyonları.

### v2.0 ve öncesi (özet)
- ZIP, CSV, çoklu dosya kuyruğu, gelişmiş filtreler, seçim modu, önizleme, bildirim ve başlık ilerlemesi, log dışa aktarma; ilk sürümlerde UDF toplu indirme ve PDF modu.

---

*Açık kaynak inceleme: `extension/main.js`, `extension/manifest.json`, `extension/ptt-helper.js`.*
