<template>
  <div class="login">
    <h1>登录</h1>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="user-select">选择账号：</label>
        <select 
          id="user-select"
          v-model="selectedUser"
          class="form-control"
          required
        >
          <option value="">请选择账号</option>
          <option 
            v-for="user in userList" 
            :key="user.id"
            :value="user"
          >
            {{ user.username }}
          </option>
        </select>
      </div>
      
      <div class="button-group">
        <button type="submit">登录</button>
        <button type="button" class="add-account" @click="showAddAccountDialog = true">
          添加账号
        </button>
      </div>
    </form>

    <!-- 添加账号对话框 -->
    <el-dialog
      v-model="showAddAccountDialog"
      title="添加账号"
      width="500px"
      :close-on-click-modal="false"
      custom-class="add-account-dialog"
    >
      <el-form 
        :model="newAccountForm" 
        :rules="formRules"
        ref="addAccountForm"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="账号" prop="username">
          <el-input 
            v-model="newAccountForm.username" 
            placeholder="请输入账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="newAccountForm.password" 
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="Cookie" prop="cookie">
          <el-input 
            v-model="newAccountForm.cookie" 
            type="textarea"
            placeholder="请输入Cookie"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </el-form-item>
        <div class="cookie-link">
          <router-link to="/get-cookie">
            如何获取Cookie？
          </router-link>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button 
            size="default"
            @click="showAddAccountDialog = false"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            size="default"
            @click="handleAddAccount"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPage',
  data() {
    // 自定义校验规则：密码和Cookie至少填写一项
    const validatePasswordOrCookie = (rule, value, callback) => {
      if (!this.newAccountForm.password && !this.newAccountForm.cookie) {
        callback(new Error('密码和Cookie至少填写一项'))
      } else {
        callback()
      }
    }

    return {
      selectedUser: null,
      userList: [],
      showAddAccountDialog: false,
      newAccountForm: {
        username: '',
        password: '',
        cookie: ''
      },
      formRules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' }
        ],
        password: [
          { validator: validatePasswordOrCookie, trigger: 'blur' }
        ],
        cookie: [
          { validator: validatePasswordOrCookie, trigger: 'blur' }
        ]
      }
    }
  },
  async created() {
    try {
      const response = await api.getUserList()
      this.userList = response.map(user => ({
        id: user.accountName,
        username: user.accountName
      }))
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  },
  methods: {
    async login() {
      if (!this.selectedUser) {
        alert('请选择一个账号')
        return
      }
      
      try {
        const response = await api.login({
          username: this.selectedUser.username
        })
        
        localStorage.setItem('isLoggedIn', true)
        localStorage.setItem('token', response.token)
        this.$router.push({ name: 'HomePage' })
      } catch (error) {
        console.error('登录失败:', error)
        alert('登录失败，请重试')
      }
    },
    async handleAddAccount() {
      try {
        // 表单校验
        await this.$refs.addAccountForm.validate()
        
        await api.addAccount(this.newAccountForm)
        this.userList.push({
          id: this.newAccountForm.username,
          username: this.newAccountForm.username
        })
        ElMessage.success('添加账号成功')
        this.showAddAccountDialog = false
        this.newAccountForm = {
          username: '',
          password: '',
          cookie: ''
        }
      } catch (error) {
        // if (error instanceof Error) {
        //   // 校验错误不处理
        //   return
        // }
        console.error('添加账号失败:', error)
        ElMessage.error('添加账号失败:' + error)
      }
    }
  }
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/global.scss" as *;

.login {
  max-width: 480px;
  margin: 80px auto;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
  background: linear-gradient(145deg, #ffffff 0%, #f6f9fc 100%);

  h1 {
    color: $primary-color;
    margin-bottom: 24px;
    text-align: center;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 1px;
    font-family: inherit;
  }

  @media (max-width: 768px) {
    max-width: 90%;
    margin: 40px auto;
    padding: 24px;
    border-radius: 8px;

    h1 {
      font-size: 24px;
      margin-bottom: 20px;
    }
  }
}

.form-group {
  margin-bottom: 24px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #606266;
    font-size: 14px;
    font-family: inherit;
  }

  .form-control {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-size: 14px;
    font-family: inherit;

    &:focus {
      border-color: $primary-color;
      outline: none;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 20px;

    .form-control {
      height: 44px;
      font-size: 14px;
      padding: 0 12px;
    }

    label {
      font-size: 13px;
      margin-bottom: 6px;
    }
  }
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 32px;

  button {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
    font-family: inherit;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &[type="submit"] {
      background-color: $primary-color;
      color: white;
      font-weight: 600;

      &:hover {
        background-color: darken($primary-color, 5%);
        box-shadow: 0 4px 12px rgba($primary-color, 0.2);
      }
    }

    &.add-account {
      background-color: #f0f2f5;
      color: #606266;

      &:hover {
        background-color: darken(#f0f2f5, 5%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;

    button {
      width: 100%;
      padding: 12px;
    }
  }
}

.add-account-dialog {
  width: 400px !important;

  @media (max-width: 768px) {
    width: 90% !important;
  }

  .el-dialog__header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid #ebeef5;
  }

  @media (max-width: 768px) {
    width: 90% !important;

    .el-dialog__header {
      padding: 16px;
    }

    .el-dialog__body {
      padding: 16px;
    }

    .el-dialog__footer {
      padding: 12px 16px;
    }

    .el-form-item {
      margin-bottom: 16px;
    }

    .el-input,
    .el-textarea {
      font-size: 14px;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 新增背景装饰
.login::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba($primary-color, 0.05) 0%, rgba($primary-color, 0.02) 100%);
  z-index: -1;
  border-radius: 12px;
}

/* 新增下拉框选项样式 */
select {
  @media (max-width: 768px) {
    option {
      font-size: 14px;
      padding: 8px 12px;
    }
  }
}

/* 确保选择器优先级足够高 */
:deep(.add-account-dialog) {
  width: 400px !important;

  @media (max-width: 768px) {
    width: 90% !important;
  }
}

/* 直接修改el-dialog样式 */
:deep(.el-dialog) {
  width: 400px !important;

  @media (max-width: 768px) {
    width: 90% !important;
  }
}

/* 新增链接样式 */
.cookie-link {
  margin-top: 8px;
  text-align: right;

  a {
    color: $primary-color;
    font-size: 12px;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-width: 768px) {
    text-align: left;
    margin-top: 6px;
  }
}
</style> 