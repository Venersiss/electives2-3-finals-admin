<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <!-- Header -->
    <div class="m-4 p-4 bg-slate-800 rounded-md flex justify-between items-center flex-wrap gap-4">
      <h1 class="text-3xl md:text-4xl font-bold text-pixel-gold">ADMIN INVITATIONS</h1>
      <router-link to="/dashboard" class="pixel-btn-secondary px-4 py-2 whitespace-nowrap">← BACK</router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 m-4">
      <!-- Create Invitation Form -->
      <div class="lg:col-span-1">
        <div class="p-4 bg-slate-800 rounded-md">
          <h2 class="text-xl md:text-2xl font-bold text-pixel-gold mb-4">SEND INVITATION</h2>
          
          <form @submit.prevent="sendInvitation" class="space-y-4">
            <div>
              <label class="block text-pixel-gold font-bold mb-2">EMAIL ADDRESS</label>
              <input 
                v-model="invitationForm.email" 
                type="email"
                class="pixel-input w-full"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label class="block text-pixel-gold font-bold mb-2">EXPIRATION DAYS</label>
              <input 
                v-model.number="invitationForm.expirationDays"
                type="number"
                class="pixel-input w-full"
                min="1"
                max="30"
                value="7"
                required
              />
              <p class="text-slate-400 text-xs mt-1">How many days until the invitation expires</p>
            </div>

            <button 
              type="submit"
              :disabled="loading"
              class="pixel-btn w-full disabled:opacity-50"
            >
              {{ loading ? 'SENDING...' : 'SEND INVITATION' }}
            </button>
          </form>

          <div v-if="successMessage" class="mt-4 p-4 bg-green-900 border-2 border-green-600 rounded text-green-100">
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="mt-4 p-4 bg-red-900 border-2 border-red-600 rounded text-red-100">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- Pending Invitations List -->
      <div class="lg:col-span-1">
        <div class="p-4 bg-slate-800 rounded-md">
          <h2 class="text-xl md:text-2xl font-bold text-pixel-gold mb-4">PENDING INVITATIONS ({{ pendingInvitations.length }})</h2>
          
          <div v-if="loadingInvitations" class="text-slate-400 text-center py-8">
            Loading invitations...
          </div>

          <div v-else-if="pendingInvitations.length === 0" class="text-slate-400 text-center py-8">
            No pending invitations. Send one to get started!
          </div>

          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div 
              v-for="inv in pendingInvitations"
              :key="inv.id"
              class="invitation-item border-2 border-pixel-gold p-3 rounded bg-slate-700"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="font-bold text-pixel-gold text-sm">{{ inv.invitedEmail }}</p>
                  <p class="text-xs text-slate-400">Code: <span class="text-slate-300 font-mono">{{ inv.invitationCode }}</span></p>
                </div>
                <button 
                  @click="copyToClipboard(inv.invitationCode)"
                  class="pixel-btn-secondary px-3 py-1 text-xs whitespace-nowrap"
                  title="Copy invitation code to clipboard"
                >
                  📋 COPY
                </button>
              </div>
              
              <div class="flex justify-between items-center text-xs text-slate-400 mb-2">
                <p>Created: {{ formatDate(inv.created_at) }}</p>
                <p>Expires: {{ formatDate(inv.expiresAt) }}</p>
              </div>

              <button 
                @click="deleteInvitation(inv.id)"
                class="pixel-btn-secondary px-3 py-1 text-xs bg-red-900 hover:bg-red-800 w-full"
              >
                🗑️ DELETE
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Used Invitations History -->
      <div class="lg:col-span-2">
        <div class="p-4 bg-slate-800 rounded-md">
          <h2 class="text-xl md:text-2xl font-bold text-pixel-gold mb-4">USED INVITATIONS ({{ usedInvitations.length }})</h2>
          
          <div v-if="usedInvitations.length === 0" class="text-slate-400 text-center py-4">
            No used invitations yet.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-slate-300">
              <thead class="border-b border-pixel-gold text-pixel-gold">
                <tr>
                  <th class="text-left py-2 px-2">Email</th>
                  <th class="text-left py-2 px-2">Used By</th>
                  <th class="text-left py-2 px-2">Used Date</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="inv in usedInvitations" 
                  :key="inv.id"
                  class="border-b border-slate-700 hover:bg-slate-700"
                >
                  <td class="py-2 px-2">{{ inv.invitedEmail }}</td>
                  <td class="py-2 px-2">{{ inv.usedByUsername || 'Admin #' + inv.usedBy }}</td>
                  <td class="py-2 px-2">{{ formatDate(inv.usedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/library/supabase'

export default {
  name: 'AdminInvitations',
  data() {
    return {
      invitationForm: {
        email: '',
        expirationDays: 7
      },
      pendingInvitations: [],
      usedInvitations: [],
      loading: false,
      loadingInvitations: false,
      successMessage: null,
      errorMessage: null,
      adminId: null
    }
  },
  mounted() {
    this.adminId = localStorage.getItem('adminId')
    if (!this.adminId) {
      this.$router.push('/login')
      return
    }
    this.loadInvitations()
  },
  methods: {
    generateInvitationCode() {
      // Generate random 8-character code: e.g., "A7K2Q9M4"
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    },

    async sendInvitation() {
      this.loading = true
      this.successMessage = null
      this.errorMessage = null

      // Validate admin ID exists
      if (!this.adminId) {
        this.errorMessage = 'Admin ID not found. Please login again.'
        this.loading = false
        this.$router.push('/login')
        return
      }

      const adminIdInt = parseInt(this.adminId)
      console.log('🔍 Checking admin ID:', this.adminId, 'parsed as:', adminIdInt)

      try {
        // Verify that the current admin exists in adminCredentials table
        const { data: currentAdmin, error: adminCheckErr } = await supabase
          .from('adminCredentials')
          .select('*')
          .eq('id', adminIdInt)
          .single()

        console.log('✅ Admin check result:', { currentAdmin, adminCheckErr })

        if (adminCheckErr || !currentAdmin) {
          this.errorMessage = `Your admin account is no longer valid (ID: ${adminIdInt}). Please login again.`
          console.error('❌ Admin validation error:', adminCheckErr)
          this.loading = false
          this.$router.push('/login')
          return
        }

        console.log('✅ Admin verified:', currentAdmin.username)
      } catch (err) {
        this.errorMessage = 'Error validating admin account: ' + err.message
        console.error('Error:', err)
        this.loading = false
        return
      }

      try {
        // Check if email already exists in adminCredentials
        const { data: existingAdmin } = await supabase
          .from('adminCredentials')
          .select('id')
          .eq('email', this.invitationForm.email)
          .single()

        if (existingAdmin) {
          this.errorMessage = 'An admin with this email already exists'
          this.loading = false
          return
        }
      } catch (err) {
        // Expected - no existing admin found
      }

      try {
        // Check if invitation already exists for this email
        const { data: existingInv } = await supabase
          .from('Invitations')
          .select('id')
          .eq('invitedEmail', this.invitationForm.email)
          .eq('isUsed', false)
          .single()

        if (existingInv) {
          this.errorMessage = 'An active invitation for this email already exists'
          this.loading = false
          return
        }
      } catch (err) {
        // Expected - no existing invitation found
      }

      try {
        const invitationCode = this.generateInvitationCode()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + this.invitationForm.expirationDays)

        const { error } = await supabase
          .from('Invitations')
          .insert([{
            invitationCode,
            invitedEmail: this.invitationForm.email,
            createdBy: parseInt(this.adminId),
            isUsed: false,
            expiresAt: expiresAt.toISOString()
          }])

        if (error) throw error

        this.successMessage = `Invitation sent to ${this.invitationForm.email}`
        this.invitationForm.email = ''
        this.invitationForm.expirationDays = 7
        
        // Reload invitations
        await this.loadInvitations()
      } catch (err) {
        this.errorMessage = 'Error sending invitation: ' + err.message
        console.error('Error:', err)
      } finally {
        this.loading = false
      }
    },

    async loadInvitations() {
      this.loadingInvitations = true
      try {
        // Load pending invitations
        const { data: pending, error: pendingErr } = await supabase
          .from('Invitations')
          .select('*')
          .eq('isUsed', false)
          .order('created_at', { ascending: false })

        if (pendingErr) throw pendingErr
        this.pendingInvitations = pending || []

        // Load used invitations with admin usernames
        const { data: used, error: usedErr } = await supabase
          .from('Invitations')
          .select(`
            id,
            invitedEmail,
            usedBy,
            usedAt,
            createdBy
          `)
          .eq('isUsed', true)
          .order('usedAt', { ascending: false })

        if (usedErr) throw usedErr

        // Get admin usernames for used invitations
        const usedByIds = [...new Set((used || []).map(u => u.usedBy).filter(Boolean))]
        let usernameMap = {}

        if (usedByIds.length > 0) {
          const { data: admins } = await supabase
            .from('adminCredentials')
            .select('id, username')
            .in('id', usedByIds)

          admins?.forEach(admin => {
            usernameMap[admin.id] = admin.username
          })
        }

        this.usedInvitations = (used || []).map(inv => ({
          ...inv,
          usedByUsername: usernameMap[inv.usedBy]
        }))
      } catch (err) {
        console.error('Error loading invitations:', err)
      } finally {
        this.loadingInvitations = false
      }
    },

    async deleteInvitation(id) {
      if (confirm('Are you sure you want to delete this invitation?')) {
        try {
          const { error } = await supabase
            .from('Invitations')
            .delete()
            .eq('id', id)

          if (error) throw error

          this.successMessage = 'Invitation deleted'
          await this.loadInvitations()
        } catch (err) {
          this.errorMessage = 'Error deleting invitation: ' + err.message
          console.error('Error:', err)
        }
      }
    },

    copyToClipboard(code) {
      navigator.clipboard.writeText(code).then(() => {
        alert('Invitation code copied to clipboard!')
      }).catch(err => {
        console.error('Failed to copy:', err)
      })
    },

    formatDate(dateString) {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }
  }
}
</script>

<style scoped>
.invitation-item {
  animation: slideInRight 0.4s ease-out;
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
