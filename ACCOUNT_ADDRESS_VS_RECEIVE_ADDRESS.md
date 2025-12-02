# 账户地址和收款地址的区别

## 概述

在 ICP 钱包中，有两个相关的地址概念：
1. **账户地址（Principal）**：用户身份标识
2. **收款地址（AccountIdentifier）**：ICP Ledger 中的账户标识符

## 详细对比

### 1. 账户地址（Principal）

#### 定义
- **Principal** 是 Internet Computer 网络中的**用户身份标识**
- 当你使用 Internet Identity 登录时，系统会为你分配一个唯一的 Principal
- 这是你在 ICP 网络中的"身份证"

#### 格式
```
abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc
```
- 使用连字符分隔的字符串格式
- 可读性较好，容易识别和记忆

#### 用途
1. **身份认证**：标识你在 ICP 网络中的身份
2. **Canister 调用**：调用智能合约时使用 Principal 作为调用者标识
3. **转账输入**：转账时可以输入 Principal，系统会自动转换为 AccountIdentifier
4. **用户资料**：在聊天应用中，Principal 用于标识消息发送者

#### 特点
- ✅ 人类可读：格式清晰，容易识别
- ✅ 唯一性：每个用户有唯一的 Principal
- ✅ 持久性：登录后 Principal 不会改变
- ❌ 不能直接用于 ICP Ledger：需要转换为 AccountIdentifier

### 2. 收款地址（AccountIdentifier）

#### 定义
- **AccountIdentifier** 是 ICP Ledger（账本）中使用的**账户标识符**
- 它是从 Principal 计算出来的 32 字节标识符
- 这是你在 ICP Ledger 中的"银行账户号"

#### 格式
```
a024ae444c...764b8d0a1a
```
- 64 个十六进制字符（32 字节）
- 通常显示为：`前6位...后4位` 的格式

#### 计算方式
```
AccountIdentifier = SHA-224(Principal + SubAccount) + CRC32校验和
```
- 28 字节 SHA-224 哈希 + 4 字节 CRC32 校验和 = 32 字节

#### 用途
1. **ICP Ledger 操作**：查询余额、转账等操作必须使用 AccountIdentifier
2. **收款**：其他人向你的 AccountIdentifier 转账
3. **账户标识**：在 ICP Ledger 中唯一标识你的账户

#### 特点
- ✅ ICP Ledger 标准：符合 ICP 账本规范
- ✅ 支持子账户：可以通过 SubAccount 创建多个账户
- ✅ 校验功能：CRC32 可以验证地址有效性
- ❌ 可读性差：十六进制字符串，不易识别
- ❌ 不能直接反推：无法从 AccountIdentifier 反推出 Principal

## 关系图

```
┌─────────────────┐
│   Principal     │  用户身份标识
│  (账户地址)      │  格式：abcde-abcde-...
└────────┬────────┘
         │
         │ 计算转换
         │ SHA-224 + CRC32
         ▼
┌─────────────────┐
│ AccountIdentifier│  ICP Ledger 账户标识
│  (收款地址)      │  格式：a024ae444c...764b8d0a1a
└─────────────────┘
```

## 在代码中的使用

### 账户地址（Principal）的显示

在钱包页面的"账户信息"部分显示：

```typescript
<div className="wallet-account-info">
  <div className="wallet-label">账户地址</div>
  <div className="wallet-principal">{principal}</div>
</div>
```

显示示例：`abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc`

### 收款地址（AccountIdentifier）的显示

在"收款"功能中显示：

```typescript
<div className="wallet-address-text">
  {formatAccountIdentifier(accountIdentifier)}
</div>
```

显示示例：`a024ae444c...764b8d0a1a`

### 转账时的处理

虽然转账表单要求输入 Principal，但系统会自动转换：

```typescript
// 用户输入 Principal
const toPrincipal = Principal.fromText(transferTo);

// 系统自动转换为 AccountIdentifier
const toAccountIdentifier = await principalToAccountIdentifier(toPrincipal);

// 使用 AccountIdentifier 进行转账
await ledger.transfer({
  to: toAccountIdentifier,
  // ...
});
```

## 使用场景对比

### 使用 Principal（账户地址）的场景

1. **转账输入**：转账时可以输入 Principal，系统会自动转换
2. **身份标识**：在应用中标识用户身份
3. **Canister 调用**：调用智能合约时作为调用者
4. **用户资料**：存储和显示用户信息

### 使用 AccountIdentifier（收款地址）的场景

1. **收款**：提供收款地址给他人
2. **查询余额**：查询 ICP Ledger 中的余额
3. **转账目标**：实际转账时使用（虽然可以输入 Principal，但会转换为 AccountIdentifier）
4. **交易记录**：在 ICP Ledger 中记录交易

## 为什么需要两个地址？

### 1. 不同的用途

- **Principal**：用于身份认证和应用层
- **AccountIdentifier**：用于 ICP Ledger 的账本操作

### 2. 标准化

- ICP Ledger 使用 AccountIdentifier 作为标准账户标识
- 这是 ICP 网络的设计规范

### 3. 功能扩展

- AccountIdentifier 支持 SubAccount（子账户）
- 一个 Principal 可以拥有多个 AccountIdentifier
- 支持更复杂的账户管理需求

### 4. 隐私保护

- AccountIdentifier 是哈希值，不能直接反推出 Principal
- 提供一定程度的隐私保护

## 常见问题

### Q: 转账时应该用哪个地址？

A: **两个都可以**！
- 输入 Principal：系统会自动转换为 AccountIdentifier
- 输入 AccountIdentifier：直接使用

推荐使用 Principal，因为：
- 更容易识别和验证
- 格式更清晰
- 不容易输入错误

### Q: 收款时应该提供哪个地址？

A: **推荐使用 AccountIdentifier（收款地址）**
- 这是标准的收款地址格式
- 其他钱包和应用都支持
- 更专业和规范

但也可以提供 Principal，对方可以手动转换。

### Q: 两个地址会改变吗？

A: 
- **Principal**：登录后不会改变，除非使用不同的 Internet Identity
- **AccountIdentifier**：只要 Principal 不变，AccountIdentifier 也不会改变（使用相同 SubAccount 的情况下）

### Q: 可以互相转换吗？

A:
- ✅ Principal → AccountIdentifier：可以（确定性计算）
- ❌ AccountIdentifier → Principal：不可以（哈希不可逆）

## 总结

| 特性 | 账户地址（Principal） | 收款地址（AccountIdentifier） |
|------|---------------------|---------------------------|
| **类型** | 用户身份标识 | ICP Ledger 账户标识 |
| **格式** | 连字符分隔字符串 | 64 位十六进制 |
| **可读性** | ✅ 高 | ❌ 低 |
| **用途** | 身份认证、应用层 | ICP Ledger 操作 |
| **转换** | → AccountIdentifier | 不能反推 |
| **唯一性** | 每个用户唯一 | 每个账户唯一 |
| **支持子账户** | ❌ | ✅ |

**简单记忆**：
- **账户地址（Principal）** = 你的"身份证号"（人类可读）
- **收款地址（AccountIdentifier）** = 你的"银行账户号"（机器可读）

两者指向同一个账户，只是在不同场景下使用不同的表示方式。

