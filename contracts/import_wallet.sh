#!/bin/bash

# Скрипт для импорта кошелька с мнемоник фразой

echo "=== Импорт кошелька OneChain ==="
echo ""
echo "Введите вашу мнемоник фразу (12, 15, 18, 21 или 24 слова):"
read -s MNEMONIC

if [ -z "$MNEMONIC" ]; then
    echo "Ошибка: мнемоник фраза не может быть пустой"
    exit 1
fi

echo ""
echo "Импортирую кошелек с схемой ed25519..."

# Импортируем с ed25519 (стандартная схема)
one_chain keytool import "$MNEMONIC" ed25519 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Кошелек успешно импортирован!"
    echo ""
    
    # Получаем адрес из вывода или проверяем список
    echo "Список импортированных ключей:"
    one_chain keytool list
    
    echo ""
    echo "Переключаюсь на адрес: 0x195809d7fa86b379fa8f9d0e7ca1edb78f0db32cac09c9d2a8d6667e00636d71"
    one_chain client switch --address 0x195809d7fa86b379fa8f9d0e7ca1edb78f0db32cac09c9d2a8d6667e00636d71 2>&1
    
    echo ""
    echo "Проверяю активный адрес:"
    one_chain client active-address
    
    echo ""
    echo "Проверяю баланс..."
    one_chain client gas
else
    echo "✗ Ошибка при импорте с ed25519, пробую secp256k1..."
    one_chain keytool import "$MNEMONIC" secp256k1 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ Кошелек успешно импортирован с secp256k1!"
        one_chain keytool list
    else
        echo "✗ Ошибка при импорте кошелька"
        echo ""
        echo "Попробуйте вручную:"
        echo "  one_chain keytool import \"ваша фраза\" ed25519"
        echo "  или"
        echo "  one_chain keytool import \"ваша фраза\" secp256k1"
        exit 1
    fi
fi
