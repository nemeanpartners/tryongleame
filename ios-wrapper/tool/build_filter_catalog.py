#!/usr/bin/env python3
"""Import the TryOn Studio filter packages into the iOS wrapper.

Reads every package zip under tryonstudio-appfiterbundles/filterpackages,
downsamples the textures embedded in each .tryonfilter to a phone-friendly
size, and writes:

  ios-wrapper/assets/tryonstudio_filters/{tog,brands}/<slug>.tryonfilter
  ios-wrapper/assets/tryonstudio_catalog.json

The catalog is what the app reads at startup to build the category dropdown
and the swipe carousel. Adding a package means dropping the zip into the
matching Brands/ or TOG/ folder, adding a display name to the map below, and
re-running this script.

    python3 ios-wrapper/tool/build_filter_catalog.py
"""
import base64
import io
import json
import os
import re
import shutil
import sys
import zipfile

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(REPO_ROOT, "tryonstudio-appfiterbundles", "filterpackages")
DEST_ROOT = os.path.join(REPO_ROOT, "ios-wrapper", "assets")
FILTER_ROOT = os.path.join(DEST_ROOT, "tryonstudio_filters")
MAX_TEXTURE = 512

# package folder name -> (group key, display name)
BRANDS = {
    "YSLrougemuseshadesinglelipstick": ("ysl", "Rouge Muse"),
    "charlottetilburypilowtalkoriginalsinglelip": ("charlotte_tilbury", "Pillow Talk Original"),
    "charlottetilburyshadestonedrosesinglelipstick": ("charlotte_tilbury", "Stoned Rose"),
    "pillowtalkorginallipstick": ("charlotte_tilbury", "Pillow Talk Lipstick"),
    "diornude100shadesingle": ("dior", "Nude 100"),
    "diorrougeshade999singlelipstick": ("dior", "Rouge 999"),
    "fentyglossbombhighbiscusshadesingle": ("fenty", "Gloss Bomb Hibiscus"),
    "fentyglossbombshadehighbiscus05lipsstickgloss": ("fenty", "Gloss Bomb Hibiscus 05"),
    "fentyglossbombstixhotchocolitshadesinglelpstick": ("fenty", "Gloss Bomb Stix Hot Chocolit"),
    "fentyglossbombstixshadefentyglowsingleshadelipglossstick": ("fenty", "Gloss Bomb Stix Fenty Glow"),
    "fentyglossbombstixshadeisitfussysinglelipglossstick": ("fenty", "Gloss Bomb Stix Fussy"),
    "fentyshadethemvpsinglelipstick": ("fenty", "The MVP"),
    "loraelriche630beigeshadesingle": ("loreal", "Colour Riche 630 Beige"),
    "macliplinershadebodlybearsingle": ("mac", "Boldly Bare Liner"),
    "macliplinershadechesnutsingle": ("mac", "Chestnut Liner"),
    "macliplinershadewhirlsingle": ("mac", "Whirl Liner"),
    "macmaracinomuchshadelipstick": ("mac", "Maracino Much"),
    "macrubywooshadesinglelipstick": ("mac", "Ruby Woo"),
    "macrussianredsinglelipstick": ("mac", "Russian Red"),
    "macshadechillsinglelipstick": ("mac", "Chill"),
    "macshadedivasingelipstick": ("mac", "Diva"),
    "macshadehoneylovesingle": ("mac", "Honey Love"),
    "macshademehrsinglelipstick": ("mac", "Mehr"),
    "macshademullittothemaxsinglelipstick": ("mac", "Mull It To The Max"),
    "macshadesoarsinglelipstick": ("mac", "Soar"),
    "macshadetaupesinglelipstick": ("mac", "Taupe"),
    "macshadevelvetteddysingle": ("mac", "Velvet Teddy"),
    "macshadewarmteddysinglelipstick": ("mac", "Warm Teddy"),
    "macshadewhirlsinglelipstick": ("mac", "Whirl"),
    "macshadeyashlipsticksingle": ("mac", "Yash"),
    "makeupbymarioflatironshadesingle": ("mario", "Flatiron"),
    "makeupbymarioshadebronxbabysinglelipstick": ("mario", "Bronx Baby"),
    "makeupbymarioshadedumbosinglelipstick": ("mario", "Dumbo"),
    "makeupbymarioshademidtwnsinglelipstick": ("mario", "Midtown"),
    "makeupbymarioshadenolitasinglelpstick": ("mario", "Nolita"),
    "makeupbymariosohosinglelipstick": ("mario", "Soho"),
    "rarebeautyshadeworthysinglelipstick": ("rare_beauty", "Worthy"),
    "rhoderaspberryjellyshadeglosssingle": ("rhode", "Raspberry Jelly"),
    "rhodeshadepbjlipglosssingle": ("rhode", "PB&J"),
}

BRAND_LABELS = {
    "mac": "MAC",
    "fenty": "Fenty Beauty",
    "charlotte_tilbury": "Charlotte Tilbury",
    "dior": "Dior",
    "mario": "Makeup by Mario",
    "rhode": "Rhode",
    "rare_beauty": "Rare Beauty",
    "ysl": "YSL",
    "loreal": "L'Oreal",
}
BRAND_ORDER = [
    "mac",
    "fenty",
    "charlotte_tilbury",
    "dior",
    "mario",
    "rhode",
    "rare_beauty",
    "ysl",
    "loreal",
]

TOG = {
    "angelkiss1TOG": ("tog_combos", "Angel Kiss"),
    "birthdaypibkccomboTOG": ("tog_combos", "Birthday Pink"),
    "blendednudelipsnlinerdark": ("tog_combos", "Blended Nude + Dark Liner"),
    "caremalisedpeachcomboTOG": ("tog_combos", "Caramelised Peach"),
    "cherryafterdarkTOGcombo": ("tog_combos", "Cherry After Dark"),
    "cherryafterdarkcomboTOG": ("tog_combos", "Cherry After Dark II"),
    "cherrycolanglosscomboTOG": ("tog_combos", "Cherry Cola Gloss"),
    "darknudecomboTOG": ("tog_combos", "Dark Nude"),
    "darknudelipsnliner": ("tog_combos", "Dark Nude Lips + Liner"),
    "firstkisscomboTOG": ("tog_combos", "First Kiss"),
    "goldenhourcomboTOG": ("tog_combos", "Golden Hour"),
    "lighterupperlippiecomboTOG": ("tog_combos", "Lighter Upper Lip"),
    "lipcomboTOG": ("tog_combos", "Signature Lip Combo"),
    "maincharacterTOGcombo": ("tog_combos", "Main Character"),
    "lip-builder-deepar-lipstick-base-brown-generated-lip-combos-baddie-gloss-ombre-baddie-ombre-liner-mask.tryonplugin": (
        "tog_combos",
        "Baddie Gloss Ombre",
    ),
    "greengoldfulleyeglamandnaturallipfulface": ("tog_combos", "Green Gold Glam"),
    "malberrystaincomboTOG": ("tog_combos", "Mulberry Stain"),
    # Full-face look: only its lip layer renders today, see note in tog_looks.
    "reddramaticfulllook": ("tog_combos", "Red Dramatic"),
    "mediterraneanTOGcombo": ("tog_combos", "Mediterranean"),
    "mediumnudecomboTOG": ("tog_combos", "Medium Nude"),
    "nudelipstickndarkerliner": ("tog_combos", "Nude Lip + Darker Liner"),
    "orangelipombre": ("tog_combos", "Orange Ombre"),
    "partypinkcomboTOG": ("tog_combos", "Party Pink"),
    "pinklipbrownliner": ("tog_combos", "Pink Lip + Brown Liner"),
    "pinklipnliner2": ("tog_combos", "Pink Lip + Liner II"),
    "pinknbrownliner": ("tog_combos", "Pink + Brown Liner"),
    "pinknbrownombrelip": ("tog_combos", "Pink & Brown Ombre"),
    "pinknnudelip": ("tog_combos", "Pink & Nude"),
    "pinkrosescomboTOG": ("tog_combos", "Pink Roses"),
    "pinkshimmerlipnbrownliner": ("tog_combos", "Pink Shimmer + Brown Liner"),
    "rosewoodlipnudecomboTOG": ("tog_combos", "Rosewood Nude"),
    "shoppinggotocasualTOG": ("tog_combos", "Shopping Go-To"),
    "sunsetcomboTOG": ("tog_combos", "Sunset"),
    "teracottacomboTOG": ("tog_combos", "Terracotta"),
    "wokeupinpinkglosscomboTOG": ("tog_combos", "Woke Up In Pink Gloss"),
    "bloomsinglelipstickshadeTOG": ("tog_shades", "Bloom"),
    "dooliealmondTOG": ("tog_shades", "Doolie Almond"),
    "dullbarbiepinklips": ("tog_shades", "Dull Barbie Pink"),
    "lip-builder-housesoft-lip-color-alpha-eh-realistic-lip-rim-soft.tryonplugin": (
        "tog_shades",
        "House Soft Lip",
    ),
    "mauvelips": ("tog_shades", "Mauve Lips"),
    "nudelipglossTOG": ("tog_shades", "Nude Lip Gloss"),
    "nudeypinklipstick": ("tog_shades", "Nudey Pink"),
    "pinklipssoft": ("tog_shades", "Soft Pink Lips"),
    "plainpink": ("tog_shades", "Plain Pink"),
    "reddybrwnlips": ("tog_shades", "Reddy Brown"),
    "shimmerredlipstickTOG": ("tog_shades", "Shimmer Red"),
    "autumnliplinershadeTOGsingle": ("tog_liners", "Autumn Liner"),
    "coffeeloerlinersingleTOG": ("tog_liners", "Coffee Lower Liner"),
    "darknudeliplinersingleTOG": ("tog_liners", "Dark Nude Liner"),
    "lightnudelinerTOGsingle": ("tog_liners", "Light Nude Liner"),
    "linershadeTOGsingle": ("tog_liners", "Signature Liner"),
    "macliplinershadeboldlybaresingleliner": ("tog_liners", "Boldly Bare Liner"),
    "orangeredlinersingleTOG": ("tog_liners", "Orange Red Liner"),
    "winelnershadeTOGsingle": ("tog_liners", "Wine Liner"),
}

# Swatch packs: one filter carrying a palette of shades, rather than one filter
# per shade. Each shade becomes a catalog entry that reuses the same asset and
# only overrides colour/opacity/finish, so 200+ shades cost one texture.
SWATCH_PACKS = [
    # source file, group key, label, section, preset region
    ("lip-swatches.tryonfilter", "lip_swatches", "Lipstick Shades", "Swatches", "lips"),
    ("blush-swatches.tryonfilter", "blush_swatches", "Blush Shades", "Swatches", "cheeks"),
]

# Not a filter package - the zip only holds two loose PNG textures.
SKIP_PACKAGES = {"liplinerbasesingle"}

# Layers that need more than the lip pipeline. A look switching any of these on
# is a full-face look and gets its own category.
FULL_FACE_LAYERS = ("eyes", "cheeks", "liner", "lashes", "glitter", "brows", "face")

GROUPS = [
    # key, label, section, category dir
    ("lip_swatches", "Lipstick Shades", "Swatches", "swatches"),
    ("blush_swatches", "Blush Shades", "Swatches", "swatches"),
    ("full_face", "Full Face Looks", "Full Face", "tog"),
    ("tog_combos", "TOG Signature Combos", "TOG", "tog"),
    ("tog_shades", "TOG Lip Shades", "TOG", "tog"),
    ("tog_liners", "TOG Lip Liners", "TOG", "tog"),
] + [(k, BRAND_LABELS[k], "Brands", "brands") for k in BRAND_ORDER]


def slugify(value):
    value = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return re.sub(r"_+", "_", value)


def shrink_data_url(data_url):
    """Re-encode an embedded PNG at most MAX_TEXTURE px on its longest side."""
    head, _, payload = data_url.partition(",")
    if not payload:
        return data_url, 0, 0
    raw = base64.b64decode(payload)
    image = Image.open(io.BytesIO(raw))
    image = image.convert("RGBA")
    longest = max(image.size)
    if longest > MAX_TEXTURE:
        ratio = MAX_TEXTURE / float(longest)
        size = (
            max(1, int(round(image.width * ratio))),
            max(1, int(round(image.height * ratio))),
        )
        image = image.resize(size, Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    shrunk = buffer.getvalue()
    if len(shrunk) >= len(raw):
        shrunk = raw
    return (
        "data:image/png;base64," + base64.b64encode(shrunk).decode("ascii"),
        len(raw),
        len(shrunk),
    )


def package_paths(section):
    """Every package archive in a section, keyed by its file name minus .zip."""
    root = os.path.join(SRC, section)
    packages = {}
    for entry in sorted(os.listdir(root)):
        path = os.path.join(root, entry)
        if not os.path.isfile(path) or not zipfile.is_zipfile(path):
            continue
        packages[entry[:-4] if entry.endswith(".zip") else entry] = path
    return packages


def read_filter(archive_path):
    with zipfile.ZipFile(archive_path) as archive:
        names = [
            n
            for n in archive.namelist()
            if n.startswith("filters/") and n.endswith(".tryonfilter")
        ]
        if len(names) != 1:
            raise SystemExit(
                "expected one filter in %s, found %s" % (archive_path, names)
            )
        return json.loads(archive.read(names[0]))


def main():
    if os.path.isdir(FILTER_ROOT):
        shutil.rmtree(FILTER_ROOT)
    for category in ("tog", "brands", "swatches"):
        os.makedirs(os.path.join(FILTER_ROOT, category), exist_ok=True)

    mapping = []
    for folder, (group, name) in TOG.items():
        mapping.append(("TOG", "tog", folder, group, name))
    for folder, (group, name) in BRANDS.items():
        mapping.append(("Brands", "brands", folder, group, name))

    # every package archive must be accounted for
    archives = {}
    for src_cat in ("TOG", "Brands"):
        archives[src_cat] = package_paths(src_cat)
        on_disk = set(archives[src_cat]) - SKIP_PACKAGES
        mapped = {m[2] for m in mapping if m[0] == src_cat}
        missing = on_disk - mapped
        extra = mapped - on_disk
        if missing or extra:
            raise SystemExit(
                "%s mapping mismatch\n  unmapped: %s\n  missing files: %s"
                % (src_cat, sorted(missing), sorted(extra))
            )

    items = []
    used_slugs = set()
    before_total = 0
    after_total = 0

    for section, category, folder, group, name in mapping:
        archive_path = archives[section][folder]
        data = read_filter(archive_path)

        if (
            data.get("schema") != "tryonstudio.filter.v1"
            or data.get("format") != "tryonfilter-json"
        ):
            raise SystemExit("unexpected filter schema in %s" % archive_path)

        regions = []
        for asset in data.get("assets", []):
            url = asset.get("dataUrl")
            if not isinstance(url, str) or not url.startswith("data:"):
                continue
            new_url, before, after = shrink_data_url(url)
            asset["dataUrl"] = new_url
            before_total += before
            after_total += after
            regions.append(asset.get("region"))

        slug = slugify(folder)
        if slug in used_slugs:
            raise SystemExit("duplicate slug %s" % slug)
        used_slugs.add(slug)

        # Name the look after the catalog entry so the runtime reports it properly.
        data["name"] = name
        data.setdefault("look", {})["name"] = name

        out_path = os.path.join(FILTER_ROOT, category, slug + ".tryonfilter")
        with open(out_path, "w") as handle:
            json.dump(data, handle, separators=(",", ":"))

        look = data.get("look", {})
        palette = look.get("palette", {})
        intensity = look.get("intensity", {})
        layers = data.get("layers", {})
        controls = data.get("lipControls", {})

        # Route by what the look actually paints, not just by the folder it
        # arrived in, so a new full-face export lands in the right category.
        extra_layers = [
            name
            for name in FULL_FACE_LAYERS
            if layers.get(name) and float(intensity.get(name, 0) or 0) > 0
        ]
        if extra_layers:
            group = "full_face"

        items.append(
            {
                "id": slug,
                "name": name,
                "group": group,
                "asset": "assets/tryonstudio_filters/%s/%s.tryonfilter" % (category, slug),
                "lipColor": palette.get("lips", "#c46e6e"),
                "linerColor": palette.get("lipliner", "#6d3540"),
                "finish": controls.get("finish", "satin"),
                "hasLiner": bool(layers.get("lipliner")) and float(intensity.get("lipliner", 0) or 0) > 0,
                "hasGloss": float(controls.get("gloss", 0) or 0) > 0,
                "hasShimmer": float(controls.get("shimmer", 0) or 0) > 0,
                "regions": [r for r in regions if r],
                "extraLayers": extra_layers,
            }
        )

    # Swatch packs
    for source, group, _label, _section, region in SWATCH_PACKS:
        path = os.path.join(SRC, "Swatches", source)
        with open(path) as handle:
            data = json.load(handle)

        for asset in data.get("assets", []):
            url = asset.get("dataUrl")
            if isinstance(url, str) and url.startswith("data:"):
                new_url, before, after = shrink_data_url(url)
                asset["dataUrl"] = new_url
                before_total += before
                after_total += after

        shades = []
        for grp in (data.get("presets") or {}).get("groups", []):
            if grp.get("region") == region:
                shades = grp.get("shades", [])
                break
        if not shades:
            raise SystemExit("no %s shades in %s" % (region, source))

        slug = slugify(os.path.splitext(source)[0])
        asset_path = "assets/tryonstudio_filters/swatches/%s.tryonfilter" % slug
        # The palette lives in the catalog, so strip it from the shipped filter.
        data.pop("presets", None)
        with open(os.path.join(FILTER_ROOT, "swatches", slug + ".tryonfilter"), "w") as handle:
            json.dump(data, handle, separators=(",", ":"))

        for index, shade in enumerate(shades):
            setting = shade.get("set") or {}
            colour = setting.get("colour") or shade.get("swatch") or "#c46e6e"
            items.append(
                {
                    "id": "%s-%s" % (slug, shade.get("id") or index),
                    "name": shade.get("name") or "Shade %d" % (index + 1),
                    "group": group,
                    "asset": asset_path,
                    "lipColor": shade.get("swatch") or colour,
                    "linerColor": colour,
                    "finish": setting.get("finish", "satin"),
                    "hasLiner": False,
                    "hasGloss": False,
                    "hasShimmer": False,
                    "regions": [region],
                    "extraLayers": [],
                    "shade": {
                        "region": region,
                        "colour": colour,
                        "opacity": setting.get("opacity", 0.9),
                        "finish": setting.get("finish", "satin"),
                    },
                }
            )

    order = {key: index for index, (key, _, _, _) in enumerate(GROUPS)}
    items.sort(
        key=lambda item: (
            order[item["group"]],
            0 if item.get("shade") else 1,
            "" if item.get("shade") else item["name"].lower(),
        )
    )

    catalog = {
        "schema": "gleame.tryonstudio-catalog.v1",
        "groups": [
            {"key": key, "label": label, "section": section}
            for key, label, section, _ in GROUPS
        ],
        "items": items,
    }

    catalog_path = os.path.join(DEST_ROOT, "tryonstudio_catalog.json")
    with open(catalog_path, "w") as handle:
        json.dump(catalog, handle, indent=2)
        handle.write("\n")

    counts = {}
    for item in items:
        counts[item["group"]] = counts.get(item["group"], 0) + 1
    for key, label, section, _ in GROUPS:
        print("%-9s %-24s %s" % (section, label, counts.get(key, 0)))
    print("filters:", len(items))
    print("textures: %.1f MB -> %.1f MB" % (before_total / 1e6, after_total / 1e6))


if __name__ == "__main__":
    sys.exit(main())
