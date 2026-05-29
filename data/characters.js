// Detective Conan characters, grouped, with Arabic names + short Arabic descriptions.
// Portraits are hotlinked from the Detective Conan World wiki (require internet).
// Adapted from detectiveconanworld.com/wiki/Characters.
(function () {
  var B = "https://www.detectiveconanworld.com";
  window.DC_CHARACTERS = [
    {
      group: "الأبطال",
      chars: [
        { name: "كونان إيدوغاوا", img: B + "/wiki/images/9/9e/Conan_Edogawa_60px.jpg", desc: "بطل السلسلة؛ شينيتشي بعد أن تقلّص جسده إلى طفل، يحلّ القضايا متخفّيًا." },
        { name: "شينيتشي كودو", img: B + "/wiki/images/f/f9/Shinichi_Kudo_60px.jpg", desc: "محقّق الثانوية العبقري؛ هويّته الحقيقية قبل التحوّل." },
        { name: "ران موري", img: B + "/wiki/images/a/af/Ran_Mouri_60px.jpg", desc: "صديقة طفولة شينيتشي وبطلة الكاراتيه، يعيش كونان في بيتها." },
        { name: "كوغورو موري", img: B + "/wiki/images/d/d3/Kogoro_Mouri_60px.jpg", desc: "والد ران ومحقّق خاص، يحلّ كونان قضاياه من خلف الكواليس." },
      ],
    },
    {
      group: "فريق المحققين الصغار",
      chars: [
        { name: "آي هايبارا", img: B + "/wiki/images/d/db/Ai_Haibara_60px.jpg", desc: "عالِمة سابقة في المنظمة (شيري) صانعة العقّار، تقلّصت وانضمّت للفريق." },
        { name: "أيومي يوشيدا", img: B + "/wiki/images/8/8d/Ayumi_Yoshida_60px.jpg", desc: "أصغر أعضاء الفريق وأكثرهم مرحًا، معجبة بكونان." },
        { name: "ميتسوهيكو تسوبورايا", img: B + "/wiki/images/a/a9/Mitsuhiko_Tsuburaya_60px.jpg", desc: "أذكى أعضاء الفريق وأكثرهم اطّلاعًا." },
        { name: "غينتا كوجيما", img: B + "/wiki/images/c/c0/Genta_Kojima_60px.jpg", desc: "قائد الفريق المندفع ومحبّ الطعام." },
        { name: "الدكتور أغاسا", img: B + "/wiki/images/3/3f/Hiroshi_Agasa_60px.jpg", desc: "جار شينيتشي والمخترع الذي يصنع أدوات كونان." },
      ],
    },
    {
      group: "العائلة والأصدقاء",
      chars: [
        { name: "سونوكو سوزوكي", img: B + "/wiki/images/c/c6/Sonoko_Suzuki_60px.jpg", desc: "صديقة ران المقرّبة من عائلة ثرية." },
        { name: "هيجي هاتوري", img: B + "/wiki/images/f/f9/Heiji_Hattori_60px.jpg", desc: "محقّق الثانوية من أوساكا، أقرب حلفاء كونان." },
        { name: "كازوها تويوما", img: B + "/wiki/images/4/4b/Kazuha_Toyama_60px.jpg", desc: "صديقة طفولة هيجي." },
        { name: "يوساكو كودو", img: B + "/wiki/images/6/64/Yusaku_Kudo_60px.jpg", desc: "والد شينيتشي وروائي بوليسي شهير." },
        { name: "يوكيكو كودو", img: B + "/wiki/images/e/eb/Yukiko_Kudo_60px.jpg", desc: "والدة شينيتشي وممثّلة سابقة بارعة في التنكّر." },
        { name: "إيري كيساكي", img: B + "/wiki/images/5/50/Eri_Kisaki_60px.jpg", desc: "والدة ران ومحامية بارعة." },
        { name: "ماسومي سيرا", img: B + "/wiki/images/c/c7/Masumi_Sera_60px.jpg", desc: "محقّقة ثانوية غامضة ترتبط بعائلة أكاي." },
        { name: "سوبارو أوكيا", img: B + "/wiki/images/8/80/Subaru_Okiya_60px.jpg", desc: "طالب جامعي يقيم في منزل كودو، تحيط به الأسرار." },
      ],
    },
    {
      group: "الشرطة",
      chars: [
        { name: "المفتّش ميغوري", img: B + "/wiki/images/4/47/Juzo_Megure_60px.jpg", desc: "مفتّش شرطة طوكيو الذي يقود معظم القضايا." },
        { name: "ميواكو ساتو", img: B + "/wiki/images/5/5f/Miwako_Sato_60px.jpg", desc: "محقّقة بارعة محبوبة في القسم." },
        { name: "واتارو تاكاغي", img: B + "/wiki/images/7/76/Wataru_Takagi_60px.jpg", desc: "محقّق مجتهد ومعجب بالضابطة ساتو." },
        { name: "نينزابورو شيراتوري", img: B + "/wiki/images/4/4d/Ninzaburo_Shiratori_60px.jpg", desc: "محقّق من عائلة مرموقة." },
      ],
    },
    {
      group: "الإف بي آي والاستخبارات",
      chars: [
        { name: "شويتشي أكاي", img: B + "/wiki/images/2/22/Shuichi_Akai_60px.jpg", desc: "قنّاص الإف بي آي الأبرز وكابوس المنظمة السوداء." },
        { name: "جودي ستارلينغ", img: B + "/wiki/images/8/8c/Jodie_Starling_60px.jpg", desc: "عميلة الإف بي آي التي تطارد فيرماوث." },
        { name: "جيمس بلاك", img: B + "/wiki/images/4/4a/James_Black_60px.jpg", desc: "قائد فريق الإف بي آي المخضرم." },
        { name: "ري فورويا (أمورو)", img: B + "/wiki/images/1/12/Rei_Furuya_60px.jpg", desc: "عميل أمن عام متخفٍّ داخل المنظمة باسم بوربون." },
        { name: "كير (هيدمي)", img: B + "/wiki/images/7/73/Hidemi_Hondou_60px.jpg", desc: "عميلة مزدوجة زُرعت داخل المنظمة السوداء." },
      ],
    },
    {
      group: "المنظمة السوداء",
      villain: true,
      chars: [
        { name: "رينيا كاراسوما", img: B + "/wiki/images/0/08/Renya_Karasuma_60px.jpg", desc: "الزعيم الغامض للمنظمة السوداء." },
        { name: "رام", img: B + "/wiki/images/3/3f/Rum_60px.jpg", desc: "الساعد الأيمن للزعيم وثاني أعلى رتبة في المنظمة." },
        { name: "جين", img: B + "/wiki/images/d/d4/Gin_60px.jpg", desc: "أخطر عملاء المنظمة وعدوّ كونان اللدود." },
        { name: "فودكا", img: B + "/wiki/images/b/b8/Vodka_60px.jpg", desc: "شريك جين ومساعده الدائم." },
        { name: "فيرماوث", img: B + "/wiki/images/b/b2/Vermouth_60px.jpg", desc: "عميلة وممثّلة بارعة في التنكّر تعرف سرّ كونان." },
        { name: "كيانتي", img: B + "/wiki/images/b/ba/Chianti_60px.jpg", desc: "قنّاصة المنظمة." },
        { name: "كورن", img: B + "/wiki/images/d/d9/Korn_60px.jpg", desc: "قنّاص المنظمة وزميل كيانتي." },
        { name: "شيهو ميانو (شيري)", img: B + "/wiki/images/7/75/Shiho_Miyano_60px.jpg", desc: "صانعة العقّار قبل هروبها؛ هي آي هايبارا." },
        { name: "أكيمي ميانو", img: B + "/wiki/images/7/71/Akemi_Miyano_60px.jpg", desc: "شقيقة شيري الكبرى." },
      ],
    },
    {
      group: "ماجيك كايتو",
      chars: [
        { name: "كايتو كوروبا", img: B + "/wiki/images/9/93/Kaito_Kuroba_60px.jpg", desc: "طالب ثانوي ورث عباءة اللص «كيد»." },
        { name: "كيد اللص", img: B + "/wiki/images/d/d1/Kaitou_Kid_60px.jpg", desc: "لصّ مُحتال أسطوري، خصم وحليف لكونان في آنٍ." },
      ],
    },
  ];
})();
