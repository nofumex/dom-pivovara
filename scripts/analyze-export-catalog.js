const fs = require('fs');
const path = require('path');

console.log('Анализ файла export_catalog.json...\n');

// Читаем файл
const filePath = path.join(__dirname, '..', 'export_catalog.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Анализ разделов (sections)
console.log('=== АНАЛИЗ РАЗДЕЛОВ (SECTIONS) ===');
const sections = data.sections || [];
console.log(`Всего разделов: ${sections.length}`);

// Группировка по уровням глубины
const sectionsByDepth = {};
const sectionIds = new Set();
const sectionIdToInfo = new Map();

sections.forEach(section => {
  const depth = section.DEPTH_LEVEL || 0;
  if (!sectionsByDepth[depth]) {
    sectionsByDepth[depth] = [];
  }
  sectionsByDepth[depth].push(section);
  sectionIds.add(String(section.ID));
  sectionIdToInfo.set(String(section.ID), {
    name: section.NAME,
    code: section.CODE,
    depth: depth,
    parentId: section.IBLOCK_SECTION_ID
  });
});

console.log('\nРазделы по уровням глубины:');
Object.keys(sectionsByDepth).sort((a, b) => a - b).forEach(depth => {
  console.log(`  Уровень ${depth}: ${sectionsByDepth[depth].length} разделов`);
});

// Проверка корневых разделов
const rootSections = sections.filter(s => !s.IBLOCK_SECTION_ID || s.IBLOCK_SECTION_ID === null);
console.log(`\nКорневых разделов (без родителя): ${rootSections.length}`);
rootSections.forEach(s => {
  console.log(`  - ${s.NAME} (ID: ${s.ID}, CODE: ${s.CODE})`);
});

// Проверка ссылок на родительские разделы
console.log('\n=== ПРОВЕРКА ССЫЛОК НА РОДИТЕЛЬСКИЕ РАЗДЕЛЫ ===');
let brokenParentLinks = 0;
sections.forEach(section => {
  if (section.IBLOCK_SECTION_ID && section.IBLOCK_SECTION_ID !== null) {
    const parentId = String(section.IBLOCK_SECTION_ID);
    if (!sectionIds.has(parentId)) {
      brokenParentLinks++;
      if (brokenParentLinks <= 5) {
        console.log(`  ❌ Раздел "${section.NAME}" (ID: ${section.ID}) ссылается на несуществующий родительский раздел ID: ${parentId}`);
      }
    }
  }
});
if (brokenParentLinks === 0) {
  console.log('  ✅ Все ссылки на родительские разделы корректны');
} else {
  console.log(`  ⚠️  Всего проблемных ссылок: ${brokenParentLinks}`);
}

// Анализ товаров (products)
console.log('\n=== АНАЛИЗ ТОВАРОВ (PRODUCTS) ===');
const products = data.products || [];
console.log(`Всего товаров: ${products.length}`);

// Проверка ссылок товаров на разделы
console.log('\n=== ПРОВЕРКА ССЫЛОК ТОВАРОВ НА РАЗДЕЛЫ ===');
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
      if (productsWithInvalidSection <= 5) {
        console.log(`  ❌ Товар "${product.NAME}" (ID: ${product.ID}) ссылается на несуществующий раздел ID: ${sectionIdStr}`);
      }
    } else {
      // Подсчитываем товары по разделам
      const count = sectionProductCount.get(sectionIdStr) || 0;
      sectionProductCount.set(sectionIdStr, count + 1);
    }
  }
});

if (productsWithoutSection === 0 && productsWithInvalidSection === 0) {
  console.log('  ✅ Все товары корректно ссылаются на разделы');
} else {
  if (productsWithoutSection > 0) {
    console.log(`  ⚠️  Товаров без раздела: ${productsWithoutSection}`);
  }
  if (productsWithInvalidSection > 0) {
    console.log(`  ⚠️  Товаров с несуществующим разделом: ${productsWithInvalidSection}`);
  }
}

// Статистика по разделам
console.log('\n=== СТАТИСТИКА ТОВАРОВ ПО РАЗДЕЛАМ ===');
const sectionsWithProducts = Array.from(sectionProductCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('Топ-20 разделов по количеству товаров:');
sectionsWithProducts.forEach(([sectionId, count]) => {
  const sectionInfo = sectionIdToInfo.get(sectionId);
  if (sectionInfo) {
    console.log(`  ${sectionInfo.name} (ID: ${sectionId}, CODE: ${sectionInfo.code}, уровень: ${sectionInfo.depth}): ${count} товаров`);
  } else {
    console.log(`  Раздел ID: ${sectionId}: ${count} товаров`);
  }
});

// Проверка наличия обязательных полей у товаров
console.log('\n=== ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ ТОВАРОВ ===');
let productsWithoutPrice = 0;
let productsWithoutName = 0;
let productsWithoutCode = 0;

products.forEach(product => {
  if (!product.NAME) productsWithoutName++;
  if (!product.CODE && !product.ID) productsWithoutCode++;
  
  // Проверка цены в PROPS
  const hasPrice = product.PROPS && product.PROPS.some(prop => 
    (prop.IBLOCK_PROPERTY_ID === '45' || prop.CODE === 'MINIMUM_PRICE') &&
    (prop.VALUE_NUM !== null && prop.VALUE_NUM !== undefined || prop.VALUE)
  );
  if (!hasPrice) {
    productsWithoutPrice++;
  }
});

console.log(`  Товаров без названия: ${productsWithoutName}`);
console.log(`  Товаров без CODE/ID: ${productsWithoutCode}`);
console.log(`  Товаров без цены: ${productsWithoutPrice}`);

// Проверка иерархии на примере
console.log('\n=== ПРИМЕР ИЕРАРХИИ РАЗДЕЛОВ ===');
const exampleSection = sections.find(s => s.DEPTH_LEVEL === 3);
if (exampleSection) {
  let current = exampleSection;
  const hierarchy = [];
  
  while (current) {
    hierarchy.unshift({
      id: current.ID,
      name: current.NAME,
      code: current.CODE,
      depth: current.DEPTH_LEVEL
    });
    
    if (current.IBLOCK_SECTION_ID) {
      const parentId = String(current.IBLOCK_SECTION_ID);
      current = sections.find(s => String(s.ID) === parentId);
    } else {
      current = null;
    }
  }
  
  console.log('Пример иерархии:');
  hierarchy.forEach((item, index) => {
    const indent = '  '.repeat(index);
    console.log(`${indent}${item.name} (ID: ${item.id}, CODE: ${item.code}, уровень: ${item.depth})`);
  });
  
  // Подсчет товаров в этой иерархии
  const sectionIdStr = String(exampleSection.ID);
  const productCount = sectionProductCount.get(sectionIdStr) || 0;
  console.log(`\n  Товаров в разделе "${exampleSection.NAME}": ${productCount}`);
}

// Итоговый отчет
console.log('\n=== ИТОГОВЫЙ ОТЧЕТ ===');
console.log(`✅ Разделов: ${sections.length}`);
console.log(`✅ Товаров: ${products.length}`);
console.log(`✅ Корневых разделов: ${rootSections.length}`);
console.log(`✅ Максимальная глубина иерархии: ${Math.max(...sections.map(s => s.DEPTH_LEVEL || 0))}`);

if (brokenParentLinks === 0 && productsWithoutSection === 0 && productsWithInvalidSection === 0) {
  console.log('\n✅ ВСЕ ДАННЫЕ КОРРЕКТНЫ! Файл готов к импорту.');
} else {
  console.log('\n⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:');
  if (brokenParentLinks > 0) console.log(`   - ${brokenParentLinks} разделов ссылаются на несуществующие родительские разделы`);
  if (productsWithoutSection > 0) console.log(`   - ${productsWithoutSection} товаров без раздела`);
  if (productsWithInvalidSection > 0) console.log(`   - ${productsWithInvalidSection} товаров ссылаются на несуществующие разделы`);
}

















