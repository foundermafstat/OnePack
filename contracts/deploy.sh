#!/bin/bash

# Скрипт для деплоя контракта OnePack

cd "$(dirname "$0")"

echo "=== Деплой контракта OnePack ==="
echo ""

# Проверяем активный адрес
echo "1. Проверяю активный адрес..."
ACTIVE_ADDRESS=$(one_chain client active-address 2>&1)
echo "Активный адрес: $ACTIVE_ADDRESS"
echo ""

# Проверяем баланс
echo "2. Проверяю баланс газа..."
one_chain client gas
echo ""

# Получаем тестовые токены если нужно
echo "3. Получаю тестовые токены (если баланс 0)..."
one_chain client faucet $ACTIVE_ADDRESS 2>&1 | head -5
echo ""

# Ждем немного для обработки транзакции
sleep 2

# Проверяем баланс снова
echo "4. Проверяю баланс после faucet..."
one_chain client gas
echo ""

# Компилируем контракт
echo "5. Компилирую контракт..."
one_chain move build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции. Деплой отменен."
    exit 1
fi

echo ""
echo "✓ Компиляция успешна!"
echo ""

# Деплоим контракт
echo "6. Деплою контракт..."
echo "Это может занять некоторое время..."
echo ""

DEPLOY_OUTPUT=$(one_chain client publish --gas-budget 100000000 2>&1)

echo "$DEPLOY_OUTPUT"

# Проверяем успешность деплоя
if echo "$DEPLOY_OUTPUT" | grep -q "Published Objects:"; then
    echo ""
    echo "✅ Контракт успешно задеплоен!"
    echo ""
    echo "=== ВАЖНАЯ ИНФОРМАЦИЯ ==="
    echo "Сохраните следующие ID из вывода выше:"
    echo "- Package ID"
    echo "- AdminCap ID"
    echo "- TreasuryCap ID"
    echo "- OnePackState ID"
    echo ""
else
    echo ""
    echo "❌ Возможна ошибка при деплое. Проверьте вывод выше."
fi
