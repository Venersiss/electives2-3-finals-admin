<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <!-- Header -->
    <div class="m-4 p-4 bg-slate-800 rounded-md flex justify-between items-center flex-wrap gap-4">
      <h1 class="text-3xl md:text-4xl font-bold text-pixel-gold">ITEM MANAGER</h1>
      <router-link to="/dashboard" class="pixel-btn-secondary px-4 py-2 whitespace-nowrap">← BACK</router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 m-4">
      <!-- Add/Edit Form -->
      <div class="lg:col-span-1">
        <div class="p-4 bg-slate-800 rounded-md">
          <h2 class="text-xl md:text-2xl font-bold text-pixel-gold mb-4">
            {{ editingId ? 'EDIT ITEM' : 'ADD NEW ITEM' }}
          </h2>
          
          <form @submit.prevent="saveGear" class="space-y-4">
            <div>
              <label class="block text-pixel-gold font-bold mb-2">NAME</label>
              <input 
                v-model="formData.name" 
                type="text"
                class="pixel-input w-full"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">PRICE</label>
              <input 
                v-model.number="formData.price"
                type="number"
                class="pixel-input w-full"
                min="0"
                required
              />
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">GEAR TYPE</label>
              <select 
                v-model="selectedGearType"
                class="pixel-input w-full"
                required
              >
                <option value="">-- SELECT GEAR TYPE --</option>
                <option value="weaponGear">Weapon</option>
                <option value="headGear">Head</option>
                <option value="bodyGear">Armor</option>
                <option value="footGear">Foot</option>
              </select>
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">HP BONUS</label>
              <input 
                v-model.number="formData.hp"
                type="number"
                class="pixel-input w-full"
                min="0"
                required
              />
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">STOCK</label>
              <input 
                v-model.number="formData.stock"
                type="number"
                class="pixel-input w-full"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">DESCRIPTION</label>
              <textarea 
                v-model="formData.description"
                class="pixel-textarea w-full h-20"
                placeholder="Describe the item..."
              ></textarea>
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">IMAGE URL</label>
              <input 
                v-model="formData.image"
                type="text"
                class="pixel-input w-full"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button type="submit" class="pixel-btn">
                {{ editingId ? 'UPDATE' : 'CREATE' }}
              </button>
              <button 
                v-if="editingId"
                type="button" 
                @click="cancelEdit"
                class="pixel-btn-secondary"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Items List -->
      <div class="lg:col-span-2">
        <div class="p-4 bg-slate-800 rounded-md">
          <h2 class="text-xl md:text-2xl font-bold text-pixel-gold mb-4">
            ALL ITEMS ({{ filteredItems.length }})
          </h2>

          <!-- Search and Filter Controls -->
          <div v-if="items.length > 0" class="space-y-4 mb-4">
            <!-- Search and Category Filter -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-pixel-gold font-bold mb-2 text-sm">SEARCH ITEMS</label>
                <input 
                  v-model="searchQuery"
                  type="text"
                  class="pixel-input w-full"
                  placeholder="Search by item name..."
                />
              </div>
              <div>
                <label class="block text-pixel-gold font-bold mb-2 text-sm">FILTER BY CATEGORY</label>
                <select 
                  v-model="filterCategory"
                  class="pixel-input w-full"
                >
                  <option value="">-- ALL CATEGORIES --</option>
                  <option value="weaponGear">Weapon</option>
                  <option value="headGear">Head</option>
                  <option value="bodyGear">Armor</option>
                  <option value="footGear">Foot</option>
                </select>
              </div>
            </div>

            <!-- Source Filter Buttons -->
            <div class="flex flex-wrap gap-2 items-center">
              <label class="block text-pixel-gold font-bold text-sm">SOURCE:</label>
              <button
                @click="filterSource = 'all'"
                :class="[
                  'pixel-button text-sm py-1 px-3 transition-colors',
                  filterSource === 'all' 
                    ? 'bg-pixel-gold text-slate-900 font-bold' 
                    : 'bg-slate-700 hover:bg-slate-600'
                ]"
              >
                ALL
              </button>
              <button
                @click="filterSource = 'admin'"
                :class="[
                  'pixel-button text-sm py-1 px-3 transition-colors',
                  filterSource === 'admin' 
                    ? 'bg-blue-500 text-white font-bold' 
                    : 'bg-slate-700 hover:bg-slate-600'
                ]"
              >
                ADMIN
              </button>
              <button
                @click="filterSource = 'user'"
                :class="[
                  'pixel-button text-sm py-1 px-3 transition-colors',
                  filterSource === 'user' 
                    ? 'bg-green-500 text-white font-bold' 
                    : 'bg-slate-700 hover:bg-slate-600'
                ]"
              >
                USER
              </button>
            </div>
          </div>
          
          <div v-if="items.length === 0" class="text-slate-400 text-center py-8">
            No items yet. Select a gear type and create one using the form!
          </div>

          <div v-else-if="filteredItems.length === 0" class="text-slate-400 text-center py-8">
            No items match your search or filter criteria.
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="item in filteredItems"
              :key="item._category + '-' + item.id"
              class="gear-item border-2 border-pixel-gold p-4 rounded bg-slate-700 transition-all"
            >
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-pixel-gold">{{ getItemName(item) }}</h3>
                  <p class="text-slate-300 text-sm">💰 Price: {{ item.price }} | ❤️ HP: +{{ item.hp }}</p>
                  <p class="text-slate-400 text-sm">📦 Stock: {{ item.stock }}</p>
                  <p class="text-slate-300 text-sm mt-2">{{ item.description }}</p>
                </div>
                <div v-if="item.image" class="ml-4">
                  <img :src="item.image" :alt="getItemName(item)" class="w-16 h-16 object-cover rounded border border-pixel-gold">
                </div>
              </div>

              <div class="flex gap-2 flex-wrap">
                <button 
                  @click="editItem(item)"
                  class="pixel-btn-secondary px-4 py-1 text-sm whitespace-nowrap"
                >
                  ✏️ EDIT
                </button>
                <button 
                  @click="deleteItem(item.id)"
                  class="pixel-btn-secondary px-4 py-1 text-sm bg-red-900 hover:bg-red-800 whitespace-nowrap"
                >
                  🗑️ DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/library/supabase'

export default {
  name: 'ItemManager',
  data() {
    return {
      selectedGearType: '',
      items: [],
      searchQuery: '',
      filterCategory: '',
      filterSource: 'all', // 'all', 'admin', 'user'
      editingId: null,
      formData: {
        name: '',
        price: 0,
        hp: 0,
        stock: 0,
        description: '',
        image: ''
      },
      loading: false
    }
  },
  computed: {
    filteredItems() {
      return this.items.filter(item => {
        // Filter by search query
        const searchLower = this.searchQuery.toLowerCase().trim()
        const itemName = this.getItemName(item).toLowerCase()
        const matchesSearch = !searchLower || itemName.includes(searchLower)

        // Filter by category
        const matchesCategory = !this.filterCategory || this.getItemCategory(item) === this.filterCategory

        // Filter by source (admin/user)
        const itemSource = item.source ? item.source.toLowerCase() : 'unknown'
        const matchesSource = this.filterSource === 'all' || itemSource === this.filterSource

        const passes = matchesSearch && matchesCategory && matchesSource
        
        if (searchLower || this.filterCategory || this.filterSource !== 'all') {
          if (passes) {
            console.log(`✅ Item "${itemName}" matches - search: "${searchLower}", category: "${this.filterCategory}", source: "${this.filterSource}", item.source: "${itemSource}"`)
          } else {
            console.log(`❌ Item "${itemName}" FILTERED OUT - search: ${matchesSearch}, category: ${matchesCategory}, source: ${matchesSource}`)
          }
        }
        return passes
      })
    }
  },
  watch: {
    searchQuery(newVal) {
      console.log('🔍 searchQuery changed to:', newVal, '- Filtered items:', this.filteredItems.length)
    },
    filterCategory(newVal) {
      console.log('🏷️ filterCategory changed to:', newVal, '- Filtered items:', this.filteredItems.length)
    },
    filterSource(newVal) {
      console.log('🔲 filterSource changed to:', newVal, '- Filtered items:', this.filteredItems.length)
    }
  },
  mounted() {
    console.log('🚀 ItemManager component mounted')
    this.loadAllItems()
  },
  methods: {
    getNameField() {
      const nameMap = {
        headGear: 'head',
        bodyGear: 'body',
        footGear: 'foot',
        weaponGear: 'weapon'
      }
      return nameMap[this.selectedGearType]
    },

    getItemName(item) {
      const nameMap = {
        headGear: 'head',
        bodyGear: 'body',
        footGear: 'foot',
        weaponGear: 'weapon'
      }
      // Try each possible name field to find which table it came from
      for (const [table, field] of Object.entries(nameMap)) {
        if (item[field]) {
          return item[field]
        }
      }
      return 'Unknown Item'
    },

    getItemCategory(item) {
      // If category is stored in metadata, use it
      if (item._category) {
        return item._category
      }

      // Otherwise, try to infer from the field names
      const nameMap = {
        headGear: 'head',
        bodyGear: 'body',
        footGear: 'foot',
        weaponGear: 'weapon'
      }
      // Find which table this item belongs to
      for (const [table, field] of Object.entries(nameMap)) {
        if (item[field]) {
          console.log(`📦 Item belongs to table: ${table}, field: ${field}, value: ${item[field]}`)
          return table
        }
      }
      console.warn('⚠️ Could not determine category for item:', item)
      return ''
    },

    async loadItems() {
      console.log('📂 loadItems() called, selectedGearType:', this.selectedGearType)
      if (!this.selectedGearType) {
        console.log('❌ No gear type selected, loading from ALL tables instead')
        await this.loadAllItems()
        return
      }
      
      this.loading = true
      try {
        console.log('🔄 Loading from single table:', this.selectedGearType, '...')
        const { data, error } = await supabase
          .from(this.selectedGearType)
          .select('*')
          .order('id', { ascending: false })

        if (error) throw error

        this.items = data || []
        console.log(`✅ Loaded ${this.items.length} items from ${this.selectedGearType}`)
        this.items.forEach((item, idx) => {
          console.log(`   Item ${idx + 1}:`, item)
        })
      } catch (err) {
        console.error('❌ Error loading items:', err)
      } finally {
        this.loading = false
      }
    },

    async loadAllItems() {
      console.log('🌍 loadAllItems() - Loading from ALL 4 tables...')
      this.loading = true
      const allItems = []
      const tables = ['headGear', 'bodyGear', 'footGear', 'weaponGear']
      
      try {
        for (const table of tables) {
          console.log(`   📂 Querying table: ${table}...`)
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('id', { ascending: false })

          if (error) {
            console.error(`   ❌ Error loading ${table}:`, error)
            continue
          }

          console.log(`   ✅ Loaded ${data.length} items from ${table}`)
          data.forEach((item) => {
            // Add category metadata to identify which table it came from
            item._category = table
            const fieldName = table === 'weaponGear' ? 'weapon' : table === 'headGear' ? 'head' : table === 'bodyGear' ? 'body' : 'foot'
            console.log(`      - ${item[fieldName]} (ID: ${item.id}, Source: ${item.source || 'undefined'})`)
          })
          allItems.push(...data)
        }

        this.items = allItems
        console.log(`🎉 Total items loaded from ALL tables: ${this.items.length}`)
        console.log('📋 Items details:', this.items)
      } catch (err) {
        console.error('❌ Error loading items from all tables:', err)
      } finally {
        this.loading = false
      }
    },

    async saveGear() {
      if (!this.selectedGearType) {
        alert('Please select a gear type')
        return
      }
      if (!this.formData.name || this.formData.price === null || this.formData.hp === null) {
        alert('Please fill in required fields')
        return
      }

      this.loading = true
      try {
        const nameField = this.getNameField()
        const payload = {
          [nameField]: this.formData.name,
          price: this.formData.price,
          hp: this.formData.hp,
          stock: this.formData.stock,
          description: this.formData.description,
          image: this.formData.image,
          source: 'admin'
        }

        if (this.editingId) {
          console.log('✏️ Updating', this.selectedGearType)
          const { error } = await supabase
            .from(this.selectedGearType)
            .update(payload)
            .eq('id', this.editingId)

          if (error) throw error
          console.log('✅ Updated successfully')
        } else {
          console.log('✨ Creating new', this.selectedGearType)
          const { error } = await supabase
            .from(this.selectedGearType)
            .insert([payload])

          if (error) throw error
          console.log('✅ Created successfully')
        }

        this.loadAllItems()
        this.resetForm()
      } catch (err) {
        console.error('Error saving item:', err)
        alert('Failed to save: ' + err.message)
      } finally {
        this.loading = false
      }
    },

    editItem(item) {
      console.log('✏️ Editing item:', item)
      
      // Determine which table this item belongs to
      let itemCategory = ''
      let itemName = ''
      const nameMap = {
        headGear: 'head',
        bodyGear: 'body',
        footGear: 'foot',
        weaponGear: 'weapon'
      }
      
      for (const [table, field] of Object.entries(nameMap)) {
        if (item[field]) {
          itemCategory = table
          itemName = item[field]
          console.log(`📦 Item belongs to ${table}, name field is "${field}": "${itemName}"`)
          break
        }
      }

      // Set the gear type so the form knows which table to update
      this.selectedGearType = itemCategory
      console.log('🎯 Set selectedGearType to:', this.selectedGearType)

      this.editingId = item.id
      this.formData = {
        name: itemName,
        price: item.price,
        hp: item.hp,
        stock: item.stock,
        description: item.description || '',
        image: item.image || ''
      }
      
      console.log('📝 Form data populated:', this.formData)
      window.scrollTo(0, 0)
    },

    async deleteItem(id) {
      if (!confirm('Are you sure you want to delete this item?')) return

      this.loading = true
      try {
        console.log('🗑️ Deleting', this.selectedGearType)
        const { error } = await supabase
          .from(this.selectedGearType)
          .delete()
          .eq('id', id)

        if (error) throw error
        console.log('✅ Deleted successfully')
        this.loadItems()
      } catch (err) {
        console.error('Error deleting item:', err)
        alert('Failed to delete: ' + err.message)
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.editingId = null
      this.formData = {
        name: '',
        price: 0,
        hp: 0,
        stock: 0,
        description: '',
        image: ''
      }
    },

    cancelEdit() {
      this.resetForm()
    }
  }
}
</script>

<style scoped>
/* Gear item animations */
.gear-item {
  animation: slideInRight 0.4s ease-out;
  transform-origin: left;
}

.gear-item:hover {
  box-shadow: 0 0 20px rgba(253, 224, 71, 0.2);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
