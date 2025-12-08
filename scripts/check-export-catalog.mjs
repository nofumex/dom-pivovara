import fs from 'fs';

console.log('Загрузка файла export_catalog.json...');
const data = JSON.parse(fs.readFileSync('export_catalog.json', 'utf8'));

const sections = data.sections || [];
const products = data.products || [];

console.log(`\n📊 СТАТИСТИКА:`);
console.log(`   Разделов (sections): ${sections.length}`);
console.log(`   Товаров (products): ${products.length}`);

// Создаем Set всех ID разделов
const sectionIds = new Set(sections.map(s => String(s.ID)));
console.log(`   Уникальных ID разделов: ${sectionIds.size}`);

// Проверяем иерархию разделов
const sectionsByDepth = {};
sections.forEach(s => {
  const depth = s.DEPTH_LEVEL || 0;
  sectionsByDepth[depth] = (sectionsByDepth[depth] || 0) + 1;
});

console.log(`\n📁 ИЕРАРХИЯ РАЗДЕЛОВ:`);
Object.keys(sectionsByDepth).sort((a, b) => a - b).forEach(depth => {
  console.log(`   Уровень ${depth}: ${sectionsByDepth[depth]} разделов`);
});

// Проверяем ссылки на родительские разделы
let brokenParentLinks = 0;
sections.forEach(s => {
  if (s.IBLOCK_SECTION_ID && s.IBLOCK_SECTION_ID !== null) {
    const parentId = String(s.IBLOCK_SECTION_ID);
    if (!sectionIds.has(parentId)) {
      brokenParentLinks++;
    }
  }
});

console.log(`\n🔗 ПРОВЕРКА ССЫЛОК РАЗДЕЛОВ:`);
if (brokenParentLinks === 0) {
  console.log(`   ✅ Все ссылки на родительские разделы корректны`);
} else {
  console.log(`   ❌ Найдено ${brokenParentLinks} разделов с несуществующими родителями`);
}

// Проверяем ссылки товаров на разделы
let productsWithoutSection = 0;
let productsWithInvalidSection = 0;
const sectionProductCount = new Map();

products.forEach(product => {
  const sectionId = product.IBLOCK_SECTION_ID;
  
  if (!sectionId || sectionId === null) {
    productsWithoutSection++;
  } else {
    const sectionIdStr = String(sectionId);
    if (!sectionIds.has(sectionIdStr)) {
      productsWithInvalidSection++;
    } else {
      const count = sectionProductCount.get(sectionIdStr) || 0;
      sectionProductCount.set(sectionIdStr, count + 1);
    }
  }
});

console.log(`\n🛍️  ПРОВЕРКА ССЫЛОК ТОВАРОВ:`);
if (productsWithoutSection === 0 && productsWithInvalidSection === 0) {
  console.log(`   ✅ Все товары корректно ссылаются на разделы`);
} else {
  if (productsWithoutSection > 0) {
    console.log(`   ⚠️  Товаров без раздела: ${productsWithoutSection}`);
  }
  if (productsWithInvalidSection > 0) {
    console.log(`   ❌ Товаров с несуществующим разделом: ${productsWithInvalidSection}`);
  }
}

// Статистика по разделам
const sectionsWithProducts = Array.from(sectionProductCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log(`\n📈 ТОП-10 РАЗДЕЛОВ ПО КОЛИЧЕСТВУ ТОВАРОВ:`);
sectionsWithProducts.forEach(([sectionId, count]) => {
  const section = sections.find(s => String(s.ID) === sectionId);
  if (section) {
    console.log(`   ${section.NAME} (ID: ${sectionId}, CODE: ${section.CODE}): ${count} товаров`);
  }
});

// Проверка обязательных полей
let productsWithoutPrice = 0;
products.forEach(product => {
  const hasPrice = product.PROPS && product.PROPS.some(prop => 
    (prop.IBLOCK_PROPERTY_ID === '45' || prop.CODE === 'MINIMUM_PRICE') &&
    (prop.VALUE_NUM !== null && prop.VALUE_NUM !== undefined || prop.VALUE)
  );
  if (!hasPrice) {
    productsWithoutPrice++;
  }
});

console.log(`\n💰 ПРОВЕРКА ЦЕН:`);
if (productsWithoutPrice === 0) {
  console.log(`   ✅ У всех товаров есть цена`);
} else {
  console.log(`   ⚠️  Товаров без цены: ${productsWithoutPrice}`);
}

// Пример иерархии
const exampleSection = sections.find(s => s.DEPTH_LEVEL === 3);
if (exampleSection) {
  console.log(`\n🌳 ПРИМЕР ИЕРАРХИИ:`);
  let current = exampleSection;
  const hierarchy = [];
  
  while (current) {
    hierarchy.unshift({
      name: current.NAME,
      code: current.CODE,
      id: current.ID,
      depth: current.DEPTH_LEVEL
    });
    
    if (current.IBLOCK_SECTION_ID) {
      const parentId = String(current.IBLOCK_SECTION_ID);
      current = sections.find(s => String(s.ID) === parentId);
    } else {
      current = null;
    }
  }
  
  hierarchy.forEach((item, index) => {
    const indent = '   '.repeat(index);
    console.log(`${indent}${item.name} (ID: ${item.id}, CODE: ${item.code})`);
  });
  
  const sectionIdStr = String(exampleSection.ID);
  const productCount = sectionProductCount.get(sectionIdStr) || 0;
  console.log(`\n   Товаров в этом разделе: ${productCount}`);
}

// Итоговый вердикт
console.log(`\n${'='.repeat(50)}`);
if (brokenParentLinks === 0 && productsWithoutSection === 0 && productsWithInvalidSection === 0) {
  console.log(`✅ ВСЕ ДАННЫЕ КОРРЕКТНЫ! Файл готов к импорту.`);
  console.log(`\n   Все товары будут корректно распределены по категориям,`);
  console.log(`   подкатегориям и подподкатегориям.`);
} else {
  console.log(`⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:`);
  if (brokenParentLinks > 0) {
    console.log(`   - ${brokenParentLinks} разделов ссылаются на несуществующие родительские разделы`);
  }
  if (productsWithoutSection > 0) {
    console.log(`   - ${productsWithoutSection} товаров без раздела (будут в fallback категории)`);
  }
  if (productsWithInvalidSection > 0) {
    console.log(`   - ${productsWithInvalidSection} товаров ссылаются на несуществующие разделы (будут в fallback категории)`);
  }
}
console.log(`${'='.repeat(50)}\n`);

