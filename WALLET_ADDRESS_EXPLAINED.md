# ICP 收款地址说明

## 收款地址是什么？

ICP 钱包的**收款地址**是 **AccountIdentifier（账户标识符）**，它是一个 32 字节的标识符，用于在 ICP Ledger（账本）中唯一标识一个账户。

## 收款地址的生成原理

### 1. 基础：Principal（用户身份）

收款地址是基于你的 **Principal（用户身份）** 计算出来的。

- **Principal** 是 Internet Computer 网络中的用户身份标识
- 当你使用 Internet Identity 登录时，系统会为你分配一个唯一的 Principal
- Principal 的格式类似：`abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc`

### 2. 计算过程

收款地址（AccountIdentifier）的计算遵循 ICP Ledger 的标准算法：

```
AccountIdentifier = SHA-224(Principal + SubAccount) + CRC32(SHA-224)
```

具体步骤：

1. **组合数据**
   - 将 Principal 转换为字节数组
   - 添加 SubAccount（子账户，默认为 32 字节的零数组）
   - 组合成：`Principal字节 + SubAccount字节`

2. **计算 SHA-224 哈希**
   - 对组合后的数据进行 SHA-256 哈希计算
   - 取前 28 字节作为 SHA-224 哈希值

3. **计算 CRC32 校验和**
   - 对 SHA-224 哈希值计算 CRC32 校验和
   - CRC32 是 4 字节的校验码，用于验证地址的有效性

4. **组合最终地址**
   - 最终地址 = 28 字节 SHA-224 哈希 + 4 字节 CRC32 校验和
   - 总共 32 字节

### 3. 代码实现

在我们的代码中，收款地址的生成在 `walletService.ts` 中：

```typescript
// 将 Principal 转换为账户标识符（AccountIdentifier）
export async function principalToAccountIdentifier(
  principal: Principal,
  subAccount?: Uint8Array
): Promise<Uint8Array> {
  // 1. 获取 Principal 的字节数组
  const principalBytes = principal.toUint8Array();
  
  // 2. 准备 SubAccount（默认为 32 字节零数组）
  const defaultSubAccount = new Uint8Array(32).fill(0);
  const subAccountBytes = subAccount || defaultSubAccount;
  
  // 3. 组合 Principal 和 SubAccount
  const data = new Uint8Array(principalBytes.length + subAccountBytes.length);
  data.set(principalBytes, 0);
  data.set(subAccountBytes, principalBytes.length);
  
  // 4. 计算 SHA-256 哈希，取前 28 字节作为 SHA-224
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const sha224 = hashArray.slice(0, 28);
  
  // 5. 计算 CRC32 校验和
  const crc = crc32(sha224);
  
  // 6. 组合：28 字节哈希 + 4 字节 CRC32 = 32 字节
  const accountIdentifier = new Uint8Array(32);
  accountIdentifier.set(sha224, 0);
  accountIdentifier.set([
    (crc >>> 24) & 0xff,
    (crc >>> 16) & 0xff,
    (crc >>> 8) & 0xff,
    crc & 0xff,
  ], 28);
  
  return accountIdentifier;
}
```

## 收款地址的显示格式

收款地址在界面上显示为**十六进制字符串**：

- 32 字节的 AccountIdentifier 转换为 64 个十六进制字符
- 例如：`a024ae444c...764b8d0a1a`
- 为了可读性，通常显示为：`前6位...后4位` 的格式

## 为什么使用 AccountIdentifier 而不是 Principal？

1. **标准化**：ICP Ledger 使用 AccountIdentifier 作为账户标识，这是 ICP 网络的标准
2. **支持子账户**：AccountIdentifier 支持 SubAccount，允许一个 Principal 拥有多个账户
3. **校验**：CRC32 校验和可以验证地址的有效性，防止输入错误
4. **隐私**：AccountIdentifier 是哈希值，不能直接反推出 Principal

## 重要说明

### 1. 一个 Principal 对应一个默认账户

- 每个 Principal 都有一个默认的 AccountIdentifier（SubAccount 为 0）
- 这是最常用的收款地址

### 2. 支持多个子账户

- 通过使用不同的 SubAccount，一个 Principal 可以拥有多个账户
- 每个 SubAccount 对应一个不同的 AccountIdentifier
- 目前我们的实现只使用默认账户（SubAccount = 0）

### 3. 地址的唯一性

- 每个 AccountIdentifier 在 ICP Ledger 中是唯一的
- 相同的 Principal + SubAccount 组合总是生成相同的 AccountIdentifier
- 这是确定性的计算，结果始终一致

## 使用场景

### 收款

- 其他人向你的 AccountIdentifier 转账时，ICP 会存入你的账户
- 你可以在钱包页面查看收款地址和二维码

### 转账

- 转账时需要提供收款方的 AccountIdentifier 或 Principal
- 系统会自动将 Principal 转换为 AccountIdentifier

### 查询余额

- 查询余额时，系统会将你的 Principal 转换为 AccountIdentifier
- 然后向 ICP Ledger 查询该账户的余额

## 总结

收款地址（AccountIdentifier）是：
- **来源**：从你的 Principal（用户身份）计算得出
- **算法**：SHA-224 哈希 + CRC32 校验和
- **格式**：32 字节（64 个十六进制字符）
- **用途**：在 ICP Ledger 中唯一标识你的账户，用于收款和转账

这个地址是确定性的，只要你的 Principal 不变，收款地址就不会改变。

