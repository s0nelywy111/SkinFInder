// ==UserScript==
// @name         DinoDrop Magnifying Glass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Добавляет лупу для поиска на lis-skins
// @author       You
// @match        https://dinodrop.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Словарь для конвертации аббревиатур
    const qualityMap = {
        'FN': 'Factory New',
        '(FN)': 'Factory New',
        'MW': 'Minimal Wear',
        '(MW)': 'Minimal Wear',
        'FT': 'Field-Tested',
        '(FT)': 'Field-Tested',
        'WW': 'Well-Worn',
        '(WW)': 'Well-Worn',
        'BS': 'Battle-Scarred',
        '(BS)': 'Battle-Scarred'
    };

    // Словарь для ножей
    const knifeNames = [
        'Bowie Knife',
        'Shadow Daggers',
        'Falchion Knife',
        'Butterfly Knife',
        'Huntsman Knife',
        'M9 Bayonet',
        'Bayonet',
        'Flip Knife',
        'Gut Knife',
        'Karambit',
        'Talon Knife',
        'Stiletto Knife',
        'Navaja Knife',
        'Ursus Knife',
        'Survival Knife',
        'Skeleton Knife',
        'Paracord Knife',
        'Nomad Knife',
        'Kukri Knife'
    ];

    // Словарь для перчаток
    const gloveNames = [
        'Bloodhound',
        'Driver',
        'Sport Gloves',
        'Specialist Gloves',
        'Hand Wraps',
        'Moto Gloves',
        'Hydra Gloves'
    ];

    function convertQuality(quality) {
        const cleanQuality = quality.trim();

        if (qualityMap[cleanQuality]) {
            return qualityMap[cleanQuality];
        }

        for (let abbr in qualityMap) {
            if (cleanQuality.includes(abbr)) {
                return qualityMap[abbr];
            }
        }

        return quality;
    }

    function convertStatTrak(itemName) {
        // Заменяем ST на StatTrak™
        return itemName.replace(/\bST\b/gi, 'StatTrak™');
    }

    function addMagnifyingGlass() {
        const currentPath = window.location.pathname;

        let itemSelectors = [];

        // Для страниц кейсов - ищем ОСНОВНЫЕ контейнеры предметов
        if (currentPath.includes('/case/')) {
            itemSelectors = [
                '.CaseInside_container__iwNk_',  // Основной контейнер предмета в кейсе
                '[class*="CaseItem_container"]'
            ];
        }
        // Для профиля и инвентаря
        else {
            itemSelectors = [
                '.NewProfileItem_container__jBPvH'
            ];
        }

        const allItems = [];
        itemSelectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            // Дополнительно фильтруем - НЕ берем элементы из верхней строки
            Array.from(found).forEach(item => {
                const isInTopBar = item.closest('[class*="TopRecentDrops"]') ||
                                  item.closest('[class*="recent-drops"]') ||
                                  item.closest('header') ||
                                  item.closest('nav');

                if (!isInTopBar) {
                    allItems.push(item);
                }
            });
        });

        allItems.forEach((item, index) => {
            if (!item.querySelector('.custom-magnifier')) {

                const magnifier = document.createElement('div');
                magnifier.className = 'custom-magnifier';
                magnifier.innerHTML = '🔍';

                magnifier.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    border-radius: 50%;
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 11px;
                    z-index: 9999;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    transition: all 0.2s ease;
                `;

                magnifier.addEventListener('mouseenter', function() {
                    this.style.background = 'rgba(0, 150, 255, 0.9)';
                    this.style.transform = 'scale(1.1)';
                });

                magnifier.addEventListener('mouseleave', function() {
                    this.style.background = 'rgba(0, 0, 0, 0.8)';
                    this.style.transform = 'scale(1)';
                });

                magnifier.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const itemName = getItemName(item);

                    if (itemName) {
                        // Конвертируем ST в StatTrak™
                        const convertedName = convertStatTrak(itemName);

                        // Проверяем если это нож или перчатки
                        const isKnife = knifeNames.some(knife => convertedName.includes(knife));
                        const isGlove = gloveNames.some(glove => convertedName.includes(glove));

                        let formattedName = convertedName
                            .toLowerCase()
                            .replace(/'/g, '%27')
                            .replace(/™/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/[()]/g, '')
                            .replace(/[^\w\-%]/g, '')
                            .replace(/\-+/g, '-')
                            .replace(/^\-|\-$/g, '');

                        // Добавляем ★ для ножей и перчаток
                        if (isKnife || isGlove) {
                            formattedName = `★-${formattedName}`;
                        }

                        const searchUrl = `https://lis-skins.com/ru/market/csgo/${formattedName}`;
                        window.open(searchUrl, '_blank');

                        this.innerHTML = '✅';
                        setTimeout(() => {
                            this.innerHTML = '🔍';
                        }, 1000);
                    } else {
                        this.innerHTML = '❌';
                        setTimeout(() => {
                            this.innerHTML = '🔍';
                        }, 1000);
                    }
                });

                item.style.position = 'relative';
                item.appendChild(magnifier);
            }
        });
    }

    function getItemName(item) {
        try {
            const currentPath = window.location.pathname;

            // Для страниц кейсов
            if (currentPath.includes('/case/')) {
                // Сначала пробуем найти конкретные элементы названия
                const weaponElement = item.querySelector('.SkinNames_weapon__CHpky');
                const weapon = weaponElement ? weaponElement.textContent.trim() : '';

                const skinNameContainer = item.querySelector('.SkinNames_name__RE45_');
                let skinName = '';

                if (skinNameContainer) {
                    const children = skinNameContainer.children;
                    for (let child of children) {
                        if (!child.classList.contains('SkinNames_quality__yKjk6')) {
                            skinName = child.textContent.trim();
                            break;
                        }
                    }
                }

                const qualityElement = item.querySelector('.SkinNames_quality__yKjk6');
                let quality = qualityElement ? qualityElement.textContent.trim() : '';
                quality = convertQuality(quality);

                // Если нашли структурированные данные
                if (weapon || skinName) {
                    let fullName = '';
                    if (weapon && skinName) {
                        fullName = `${weapon} ${skinName} ${quality}`.trim();
                    } else if (weapon) {
                        fullName = `${weapon} ${quality}`.trim();
                    } else if (skinName) {
                        fullName = `${skinName} ${quality}`.trim();
                    }
                    return fullName;
                }

                // Fallback - берем весь текст элемента
                const fallbackText = item.textContent.trim();
                if (fallbackText && fallbackText.length > 0 && fallbackText.length < 100) {
                    let itemText = fallbackText;
                    for (let abbr in qualityMap) {
                        itemText = itemText.replace(abbr, qualityMap[abbr]);
                    }
                    return itemText;
                }
            }

            // Для профиля и инвентаря
            const weaponElement = item.querySelector('.SkinNames_weapon__CHpky');
            const weapon = weaponElement ? weaponElement.textContent.trim() : '';

            const skinNameContainer = item.querySelector('.SkinNames_name__RE45_');
            let skinName = '';

            if (skinNameContainer) {
                const children = skinNameContainer.children;
                for (let child of children) {
                    if (!child.classList.contains('SkinNames_quality__yKjk6')) {
                        skinName = child.textContent.trim();
                        break;
                    }
                }
            }

            const qualityElement = item.querySelector('.SkinNames_quality__yKjk6');
            let quality = qualityElement ? qualityElement.textContent.trim() : '';
            quality = convertQuality(quality);

            let fullName = '';
            if (weapon && skinName) {
                fullName = `${weapon} ${skinName} ${quality}`.trim();
            } else if (weapon) {
                fullName = `${weapon} ${quality}`.trim();
            } else if (skinName) {
                fullName = `${skinName} ${quality}`.trim();
            }

            return fullName || null;

        } catch (error) {
            return null;
        }
    }

    function init() {
        setTimeout(addMagnifyingGlass, 2000);
        setTimeout(addMagnifyingGlass, 5000);
    }

    const observer = new MutationObserver(function() {
        setTimeout(addMagnifyingGlass, 1000);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
