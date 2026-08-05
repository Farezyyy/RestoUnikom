import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [ingredients, setIngredients] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [bahanRes, menuRes, resepRes] = await Promise.all([
        api.get('/bahan'),
        api.get('/menu'),
        api.get('/resep') // assuming there's an endpoint for this, fallback to empty if missing
      ]);

      if (bahanRes.data) {
        setIngredients(bahanRes.data.map(b => ({
          id: b.id,
          name: b.nama,
          category: b.nama.includes('Beef') || b.nama.includes('Wagyu') || b.nama.includes('Angus') ? 'Meat' :
            b.nama.includes('Scallop') || b.nama.includes('Caviar') ? 'Seafood' :
              b.nama.includes('Butter') ? 'Dairy' :
                b.nama.includes('Water') || b.nama.includes('Powder') ? 'Drink Ingredients' : 'Spices',
          stock: b.stok,
          minStock: b.stok_minimal,
          unit: b.unit
        })));
      }

      if (menuRes.data) {
        setMenuItems(menuRes.data.map(m => ({
          id: m.id,
          name: m.nama,
          category: m.kategori,
          price: m.harga,
          active: m.aktif
        })));
      }

      if (resepRes.data) {
        setRecipes(resepRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateIngredientStock = async (id, newStock) => {
    try {
      const ing = ingredients.find(i => i.id === id);
      if (!ing) return;
      
      const diff = Number(newStock) - ing.stock;
      if (diff === 0) return;
      
      await api.post('/inventory-log/adjust', {
        id_bahan: id,
        jenis_mutasi: diff > 0 ? 'IN' : 'OUT',
        jumlah: Math.abs(diff),
        keterangan: 'Manual Override'
      });
      fetchData(false);
    } catch (err) {
      console.error('Error updating stock', err);
    }
  };

  const toggleMenuManualStatus = async (id) => {
    try {
      const item = menuItems.find(m => m.id === id);
      if (!item) return;
      await api.patch(`/menu/${id}`, { aktif: !item.active });
      fetchData(false);
    } catch (err) {
      console.error('Error toggling menu', err);
    }
  };

  const updateMenuPrice = async (id, newPrice) => {
    try {
      await api.patch(`/menu/${id}`, { harga: Number(newPrice) });
      fetchData(false);
    } catch (err) {
      console.error('Error updating price', err);
    }
  };

  const getMenuAvailability = (menuItem) => {
    if (!menuItem.active) return { available: false, reason: 'Manually Disabled' };

    // Find required ingredients from recipes
    const requiredRecipes = recipes.filter(r => r.id_menu === menuItem.id);

    if (requiredRecipes.length > 0) {
      for (const req of requiredRecipes) {
        const ing = ingredients.find(i => i.id === req.id_bahan);
        // check if stock is less than required jumlah
        if (ing && ing.stock < req.jumlah) {
          return { available: false, reason: `Missing ingredient: ${ing.name}` };
        }
      }
    }
    return { available: true };
  };

  return (
    <AdminContext.Provider value={{
      ingredients,
      menuItems,
      recipes,
      loading,
      updateIngredientStock,
      getMenuAvailability,
      toggleMenuManualStatus,
      updateMenuPrice,
      fetchData
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}
