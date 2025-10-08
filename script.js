const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const areaFilter = document.getElementById('area-filter');
const recipesGrid = document.getElementById('recipes-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const noResults = document.getElementById('no-results');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');
const greetingEl = document.getElementById('greeting');
const chefSpecialSection = document.getElementById('chef-special-section');
const favoritesBtn = document.getElementById('favorites-btn');
const gridTitle = document.getElementById('grid-title');

let favorites = JSON.parse(localStorage.getItem('recipeFavorites')) || [];


async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error: ", error);
        displayError("Could not fetch recipes. Please check your connection and try again.");
        return null;
    }
}


function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
    recipesGrid.classList.toggle('hidden', show);
    noResults.classList.toggle('hidden', true); 
}

function displayNoResults(show) {
    noResults.classList.toggle('hidden', !show);
}

function displayError(message) {
    recipesGrid.innerHTML = `<div class="col-span-full text-center py-10 bg-red-50 p-6 rounded-lg">
        <i class="fas fa-exclamation-triangle fa-3x text-red-500"></i>
        <p class="mt-4 text-xl text-red-700">${message}</p>
    </div>`;
}

function renderRecipes(meals, title = "Search Results") {
    recipesGrid.innerHTML = '';
    gridTitle.textContent = title;

    if (!meals || meals.length === 0) {
        displayNoResults(true);
        return;
    }
    displayNoResults(false);
    
    meals.forEach(meal => {
        const isFavorited = favorites.includes(meal.idMeal);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out';
        card.innerHTML = `
            <div class="relative">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-48 object-cover">
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-meal-id="${meal.idMeal}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg truncate">${meal.strMeal}</h3>
                <button class="w-full mt-4 text-white font-semibold py-2 rounded-lg btn-gradient" data-meal-id="${meal.idMeal}">
                    View Recipe
                </button>
            </div>
        `;
        recipesGrid.appendChild(card);
    });
}

function renderRecipeDetails(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== "") {
            ingredients.push(`
                <li class="flex items-center space-x-3">
                    <i class="fas fa-check-circle text-orange-400"></i>
                    <span>
                        <span class="font-semibold">${measure}</span> ${ingredient}
                    </span>
                </li>
            `);
        }
    }

    const modalBody = modalContent.querySelector('div');
    modalBody.innerHTML = `
        <h2 class="text-3xl font-bold mb-4 text-gray-900">${meal.strMeal}</h2>
        <div class="flex flex-wrap gap-4 text-sm mb-6 text-gray-600">
            <span class="bg-gray-100 px-3 py-1 rounded-full font-medium"><i class="fas fa-tag mr-2"></i>${meal.strCategory}</span>
            <span class="bg-gray-100 px-3 py-1 rounded-full font-medium"><i class="fas fa-map-marker-alt mr-2"></i>${meal.strArea}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 border-b-2 border-orange-400 pb-2">Ingredients</h3>
                <ul class="space-y-2 text-gray-700">
                    ${ingredients.join('')}
                </ul>
            </div>
            <div>
                <h3 class="text-2xl font-semibold mb-4 border-b-2 border-orange-400 pb-2">Instructions</h3>
                <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">${meal.strInstructions}</p>
                ${meal.strYoutube ? `
                <div class="mt-8">
                    <h3 class="text-2xl font-semibold mb-4 border-b-2 border-orange-400 pb-2">Video Tutorial</h3>
                     <a href="${meal.strYoutube}" target="_blank" class="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">
                        <i class="fab fa-youtube"></i>
                        Watch on YouTube
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}


async function handleSearchAndFilter() {
    const searchTerm = searchInput.value.trim();
    const category = categoryFilter.value;
    const area = areaFilter.value;

    showLoading(true);

    let meals = [];
    let title = "Search Results";

    if (searchTerm) {
        const data = await fetchAPI(`search.php?s=${searchTerm}`);
        meals = data ? data.meals : null;
        title = `Results for "${searchTerm}"`;
    } else if (category) {
        const data = await fetchAPI(`filter.php?c=${category}`);
        meals = data ? data.meals : null;
        title = `${category} Recipes`;
    } else if (area) {
        const data = await fetchAPI(`filter.php?a=${area}`);
        meals = data ? data.meals : null;
        title = `${area} Cuisine`;
    } else {
        const data = await fetchAPI('search.php?s=');
        meals = data ? data.meals : null;
    }
    
    showLoading(false);
    renderRecipes(meals, title);
}

async function openModal(mealId) {
    document.body.classList.add('modal-open');
    recipeModal.classList.remove('hidden');
    recipeModal.classList.add('flex');

    modalContent.querySelector('div').innerHTML = `
        <div class="text-center p-10">
            <i class="fas fa-spinner fa-spin fa-2x text-orange-500"></i>
            <p class="mt-2 text-gray-600">Loading details...</p>
        </div>`;

    const data = await fetchAPI(`lookup.php?i=${mealId}`);
    if(data && data.meals && data.meals[0]){
         renderRecipeDetails(data.meals[0]);
    } else {
         modalContent.querySelector('div').innerHTML = `<p class="text-center text-red-500">Could not load recipe details.</p>`;
    }
    
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 50);
}

function closeModal() {
    modalContent.classList.add('scale-95', 'opacity-0');
    modalContent.classList.remove('scale-100', 'opacity-100');
    
    setTimeout(() => {
        document.body.classList.remove('modal-open');
        recipeModal.classList.add('hidden');
        recipeModal.classList.remove('flex');
    }, 300);
}

async function populateFilters() {
    const categoriesData = await fetchAPI('list.php?c=list');
    if (categoriesData && categoriesData.meals) {
        categoriesData.meals.forEach(category => {
            const option = new Option(category.strCategory, category.strCategory);
            categoryFilter.appendChild(option);
        });
    }

    const areasData = await fetchAPI('list.php?a=list');
    if (areasData && areasData.meals) {
        areasData.meals.forEach(area => {
            const option = new Option(area.strArea, area.strArea);
            areaFilter.appendChild(option);
        });
    }
}

function setGreeting() {
    const utcHours = new Date().getUTCHours();
    const istHour = (utcHours + 5) % 24;
    
    let greetingText = "Good Evening!";
    if (istHour >= 5 && istHour < 12) { 
        greetingText = "Good Morning!";
    } else if (istHour >= 12 && istHour < 17) { 
        greetingText = "Good Afternoon!";
    }
    greetingEl.textContent = `${greetingText} Welcome from Chennai!`;
}

async function displayChefSpecial() {
    const data = await fetchAPI('random.php');
    if (data && data.meals) {
        const meal = data.meals[0];
        chefSpecialSection.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Chef's Special ✨</h2>
        <div class="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-8 cursor-pointer hover:shadow-2xl transition-shadow" data-meal-id="${meal.idMeal}">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full md:w-1/3 h-64 md:h-auto object-cover rounded-xl">
            <div class="flex-1">
                <span class="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${meal.strCategory}</span>
                <h3 class="text-3xl font-bold mt-2 mb-4">${meal.strMeal}</h3>
                <p class="text-gray-600 mb-6">${meal.strInstructions.substring(0, 200)}...</p>
                <button class="text-white font-semibold py-2 px-6 rounded-lg btn-gradient">
                    View Full Recipe
                </button>
            </div>
        </div>
        `;
        chefSpecialSection.querySelector('[data-meal-id]').addEventListener('click', () => openModal(meal.idMeal));
    }
}

function toggleFavorite(mealId) {
    const button = document.querySelector(`.favorite-btn[data-meal-id="${mealId}"]`);
    const mealIndex = favorites.indexOf(mealId);

    if (mealIndex > -1) {
        favorites.splice(mealIndex, 1);
        button?.classList.remove('favorited');
    } else {
        favorites.push(mealId);
        button?.classList.add('favorited');
    }
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
}

async function displayFavorites() {
    if (favorites.length === 0) {
        renderRecipes([], "My Favorite Recipes");
        return;
    }
    
    showLoading(true);
    const favoriteMeals = await Promise.all(
        favorites.map(id => fetchAPI(`lookup.php?i=${id}`).then(data => data.meals[0]))
    );
    showLoading(false);
    renderRecipes(favoriteMeals, "My Favorite Recipes");
}



function initialize() {
    setGreeting();
    populateFilters();
    displayChefSpecial();
    handleSearchAndFilter(); 

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        categoryFilter.value = '';
        areaFilter.value = '';
        searchTimeout = setTimeout(handleSearchAndFilter, 500);
    });

    categoryFilter.addEventListener('change', () => {
        searchInput.value = '';
        areaFilter.value = '';
        handleSearchAndFilter();
    });

    areaFilter.addEventListener('change', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        handleSearchAndFilter();
    });

    recipesGrid.addEventListener('click', (e) => {
        const favoriteButton = e.target.closest('.favorite-btn');
        const viewButton = e.target.closest('button:not(.favorite-btn)');
        if (favoriteButton) {
            toggleFavorite(favoriteButton.dataset.mealId);
        } else if (viewButton) {
            openModal(viewButton.dataset.mealId);
        }
    });
    
    favoritesBtn.addEventListener('click', displayFavorites);

    modalCloseBtn.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
    });
}

document.addEventListener('DOMContentLoaded', initialize);

