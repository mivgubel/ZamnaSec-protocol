"use client"

import { useState, useEffect } from "react";
import { zFactoryAbi } from "../abi/zFactoryAbi";
import { zEnforcerAbi } from "../abi/zEnforcerAbi";
import { createWalletClient, custom, numberToHex } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";
import { useWallet } from "../components/WalletContext";
import { pad } from "viem/utils";
import { publicClient } from "../components/publicCliente";

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10" aria-hidden="true"></div>
      <div className="relative bg-white/50 border border-blue-200 rounded-2xl p-0 w-full max-w-md shadow-xl font-sans text-slate-800">
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-blue-100">
          <h3 className="text-lg font-bold" style={{ color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-[#1e293b] text-2xl font-bold focus:outline-none ml-2">&times;</button>
        </div>
        <div className="p-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

function shortAddress(addr: string) {
  if (!addr) return "N/A";
  const displayLength = 8 + 3 + 4; // 10 chars + '...' + 8 chars
  if (addr.length > displayLength) {
    return addr.slice(0, 8) + '...' + addr.slice(-4);
  } else {
    return addr;
  }
}

function formatAddressForDisplay(addr: any): string {
  if (addr === undefined || addr === null) return "N/A";
  try {
    const bigIntValue = BigInt(addr);
    return "0x" + bigIntValue.toString(16).padStart(1, '0');
  } catch (e) {
    console.error("Failed to format address for display:", addr, e);
    return addr?.toString() || "N/A"; // Fallback to string representation
  }
}

function formatValueForDisplay(value: any, type: string): string {
  if (value === undefined || value === null) return "N/A";
  try {
    const bigIntValue = BigInt(value);
    if (type === "ADDRESS") {
      return "0x" + bigIntValue.toString(16).padStart(1, '0');
    } else if (type === "UINT") {
      return bigIntValue.toString(10); // Decimal format for UINT
    }
    return value?.toString() || "N/A"; // Default to string for other types
  } catch (e) {
    console.error("Failed to format value for display:", value, type, e);
    return value?.toString() || "N/A"; // Fallback to string representation
  }
}

// Formatea el valor de la invariant según el tipo
function formatInvariantValue(value: any, type: any) {
  if (type === "1") { // UINT
    try {
      return BigInt(value).toString();
    } catch {
      return value;
    }
  } else if (type === "2") { // INT
    try {
      // Interpretar como int256 (signed)
      let hex = value.startsWith("0x") ? value : `0x${value}`;
      let bn = BigInt(hex);
      // Si el valor es mayor que el máximo de int256, ajusta a negativo
      if (bn > (BigInt(1) << BigInt(255)) - BigInt(1)) {
        bn = bn - (BigInt(1) << BigInt(256));
      }
      return bn.toString();
    } catch {
      return value;
    }
  } else if (type === "3") { // ADDRESS
    // value es bytes32, tomar los últimos 40 caracteres (20 bytes)
    let hex = value.startsWith("0x") ? value : `0x${value}`;
    // address es los últimos 40 caracteres (20 bytes)
    return `0x${hex.slice(-40)}`;
  } else if (type === "4") { // BOOL
    // bool suele ser 0x...01 o 0x...00
    return value.endsWith("1") ? "true" : "false";
  } else if (type === "5") { // BYTES32
    return value;
  }
  return value;
}

// Helper para forzar el tipo 0x{string}
function to0xString(str: string, length: number): `0x${string}` {
  let s = str.startsWith('0x') ? str : `0x${str}`;
  if (s.length !== length + 2) throw new Error(`Value must be 0x + ${length} hex chars`);
  return s as `0x${string}`;
}

// Función para acortar bytes32
function shortBytes32(val: string) {
  if (!val) return "N/A";
  if (val.length > 18) {
    return val.slice(0, 10) + '...' + val.slice(-6);
  }
  return val;
}

export default function Dashboard() {
  const [openDeployModal, setOpenDeployModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [deployConfigurer, setDeployConfigurer] = useState("");
  const [invariantName, setInvariantName] = useState("");
  const [invariantAsker, setInvariantAsker] = useState("");
  const [invariantType, setInvariantType] = useState("");
  const [invariantRule, setInvariantRule] = useState("");
  const [invariantValue, setInvariantValue] = useState("");
  const [deployError, setDeployError] = useState("");
  const [createError, setCreateError] = useState("");
  const { address } = useWallet();
  const [deploySuccess, setDeploySuccess] = useState("");
  const [toast, setToast] = useState<string | { type: 'error', message: string }>("");
  const [deployedContracts, setDeployedContracts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [invariants, setInvariants] = useState<any[]>([]);
  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editInvariantId, setEditInvariantId] = useState<number | null>(null);
  const [editInvariantName, setEditInvariantName] = useState("");
  const [editInvariantAsker, setEditInvariantAsker] = useState("");
  const [editInvariantType, setEditInvariantType] = useState("");
  const [editInvariantRule, setEditInvariantRule] = useState("");
  const [editInvariantValue, setEditInvariantValue] = useState("");
  const [editError, setEditError] = useState("");
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
  const [showDisabled, setShowDisabled] = useState(true);
  const [sortBy, setSortBy] = useState<'id' | 'type' | 'rule'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const zamnaFactory_address = "0x002c970f848662d3dd14711301839e2637daa383";

  const typeOptions = [
    { label: "UINT", value: "1" },
    { label: "INT", value: "2" },
    { label: "ADDRESS", value: "3" },
    { label: "BOOL", value: "4" },
    { label: "BYTES32", value: "5" },
  ];
  const ruleOptions = [
    { label: "<", value: "1" },
    { label: "<=", value: "2" },
    { label: "==", value: "3" },
    { label: ">=", value: "4" },
    { label: ">", value: "5" },
    { label: "!=", value: "6" },
  ];
  const boolRuleOptions = [
    { label: "==", value: "3" },
    { label: "!=", value: "6" },
  ];

  function isHexAddress(val: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(val);
  }
  function isHex32(val: string) {
    return /^0x[a-fA-F0-9]{64}$/.test(val);
  }
  function isHex(val: string) {
    return /^0x[a-fA-F0-9]+$/.test(val);
  }
  function isUint(val: string) {
    return /^\d+$/.test(val) && Number(val) >= 0;
  }
  function isInt(val: string) {
    return /^-?\d+$/.test(val);
  }
  function isBool(val: string) {
    return val === "true" || val === "false" || val === "1" || val === "0";
  }

  async function handleDeploy() {
    setDeployError("");
    setDeploySuccess("");
    if (!isHexAddress(deployConfigurer)) {
      setDeployError("Configurer Address must be a valid hexadecimal address (0x + 40 hexadecimal characters)");
      return;
    }
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setDeployError("MetaMask is not installed");
        return;
      }
      const client = createWalletClient({
        chain: mantleSepoliaTestnet,
        transport: custom((window as any).ethereum),
      });
     
      const txHash = await client.writeContract({
        address: zamnaFactory_address as `0x${string}`,
        abi: zFactoryAbi,
        functionName: "deployInvariantsContract",
        account: address as `0x${string}`,
        args: [deployConfigurer as `0x${string}`],
      });
      // Esperar a que la transacción sea minada y leer los logs
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      // Usar getContractEvents para obtener el evento InvariantsContractDeployed
      const events = await publicClient.getContractEvents({
        address: zamnaFactory_address as `0x${string}`,
        abi: zFactoryAbi,
        eventName: "InvariantsContractDeployed",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      const event = events && events.length > 0 ? events[0] : null;
      setOpenDeployModal(false);
      if (event && event.eventName === "InvariantsContractDeployed") {
        const contractAddress = (event.args as any)?.invariantContract as string;
        setDeployedContracts(prev => {
          if (!prev.includes(contractAddress)) {
            return [...prev, contractAddress];
          }
          return prev;
        });
        setActiveTab(contractAddress);
        setToast("Contract deployed successfully!");
      } else {
        setDeployError("Deployment failed: Event not emitted by contract");
      }
    } catch (err: any) {
      setDeployError(err?.shortMessage || "Failed to deploy contract");
    }
  }

  async function handleCreateInvariant() {
    setCreateError("");
    if (!invariantName.trim()) {
      setCreateError("Set a name for the invariant");
      return;
    }
    if (!isHexAddress(invariantAsker)) {
      setCreateError("Asker Address must be a valid hexadecimal address (0x + 40 hexadecimal characters)");
      return;
    }
    if (!invariantType) {
      setCreateError("You must select a type");
      return;
    }
    if (!invariantRule) {
      setCreateError("You must select a rule");
      return;
    }
    if (invariantType === "1") {
      if (!isUint(invariantValue)) {
        setCreateError("Invariant Value must be a positive integer (UINT)");
        return;
      }
    } else if (invariantType === "2") {
      if (!isInt(invariantValue)) {
        setCreateError("Invariant Value must be an integer (INT)");
        return;
      }
    } else if (invariantType === "3") {
      if (!isHexAddress(invariantValue)) {
        setCreateError("Invariant Value must be a valid hexadecimal address (0x + 40 hexadecimal characters)");
        return;
      }
    } else if (invariantType === "4") {
      if (!(invariantValue === "1" || invariantValue === "0")) {
        setCreateError("Invariant Value must be True (1) or False (0)");
        return;
      }
    } else if (invariantType === "5") {
      if (!isHex32(invariantValue)) {
        setCreateError("Invariant Value must be a 32-byte hexadecimal (0x + 64 hexadecimal characters)");
        return;
      }
    }
    // Enviar transacción a la red Mantle Sepolia al contrato zEnforcerAbi en la address de la tab activa
    try {
      if (!activeTab) {
        setCreateError("No contract selected");
        return;
      }
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setCreateError("MetaMask is not installed");
        return;
      }
      const client = createWalletClient({
        chain: mantleSepoliaTestnet,
        transport: custom((window as any).ethereum),
      });
      let valueToSend: `0x${string}`;
      if (invariantType === "3") {
        // ADDRESS: convertir a bytes32 (pad a 32 bytes)
        const address0x = to0xString(invariantValue, 40);
        valueToSend = pad(address0x, { size: 32 }) as `0x${string}`;
      } else if (invariantType === "4") {
        // BOOL: enviar como bytes32 (0x + 63 ceros + 1 o 0)
        valueToSend = `0x${'0'.repeat(63)}${invariantValue}` as `0x${string}`;
      } else if (invariantType === "5") {
        // BYTES32: asegurar formato 0x + 64 caracteres
        valueToSend = to0xString(invariantValue, 64);
      } else {
        // UINT, INT: como antes
        valueToSend = pad(numberToHex(Number(invariantValue)), { size: 32 }) as `0x${string}`;
      }
      const txHash = await client.writeContract({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        functionName: "Create_Invariant",
        account: address as `0x${string}`,
        args: [
          invariantName,
          invariantAsker as `0x${string}`,
          Number(invariantType),
          Number(invariantRule),
          valueToSend,
        ],
      });
  
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const events = await publicClient.getContractEvents({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        eventName: "Invariant_Created",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      if (events && events.length > 0) {
        setToast("Invariant created successfully!");
        setOpenCreateModal(false);
        fetchInvariants();
      } else {
        // Mostrar error como toast
        setOpenCreateModal(false);
        setToast({ type: "error", message: "Creation failed: Event not emitted by contract" });
      }
    } catch (err: any) {
      // Mostrar error como toast
      setOpenCreateModal(false);
      setToast({ type: "error", message: err?.shortMessage || "Failed to create invariant" });
    }
  }

  // Toast auto-hide for 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast("") , 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    async function fetchDeployedContracts() {
      if (!address) return;
      try {
        // Leer el número de contratos desplegados por el usuario
        const numContracts = await publicClient.readContract({
          address: zamnaFactory_address as `0x${string}`,
          abi: zFactoryAbi,
          functionName: "numContractsDeployedByUser",
          args: [address as `0x${string}`],
        });
        const contracts: string[] = [];
        for (let i = 0; i < Number(numContracts); i++) {
          try {
            const contract = await publicClient.readContract({
              // Contract's address to query.
              address: zamnaFactory_address as `0x${string}`,
              abi: zFactoryAbi,
              functionName: "contractsDeployedByUser",
              // user's address to query.
              args: [address as `0x${string}`, BigInt(i)],
            });
            if (typeof contract === 'string' && contract !== '0x0000000000000000000000000000000000000000') {
              contracts.push(contract);
            } else {
              break;
            }
          } catch {
            break;
          }
        }
        setDeployedContracts(contracts);
        if (contracts.length > 0) setActiveTab(contracts[0]);
      } catch (err) {
        // Opcional: manejar error
      }
    }
    fetchDeployedContracts();
  }, [address]);

  // Cargar invariants del contrato activo
  async function fetchInvariants() {
    setInvariants([]);
    if (!activeTab) return;
    try {
      // 1. Obtener el número de invariants
      const count = await publicClient.readContract({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        functionName: "countInvariantID",
      });
      // 2. Obtener cada invariant
      const promises: any[] = [];
      for (let i = 1; i < Number(count); i++) {
        promises.push(
          publicClient.readContract({
            address: activeTab as `0x${string}`,
            abi: zEnforcerAbi,
            functionName: "getInvariant",
            args: [BigInt(i)],
          })
        );
      }
      const results = await Promise.all(promises);
      // 3. Consultar si está activa cada invariant
      const activePromises: any[] = [];
      for (let i = 1; i < Number(count); i++) {
        activePromises.push(
          publicClient.readContract({
            address: activeTab as `0x${string}`,
            abi: zEnforcerAbi,
            functionName: "isInvariantActive",
            args: [BigInt(i)],
          })
        );
      }
      const actives = await Promise.all(activePromises);
      // 4. Unir datos
      const invariantsData = results.map((inv: any, idx: number) => ({
        id: idx,
        name: inv[0],
        asker: inv[1],
        type: inv[2],
        rule: inv[3],
        value: inv[4],
        enabled: actives[idx],
      }));
      setInvariants(invariantsData);
    } catch (err) {
      // Si hay error, dejar invariants vacío
      setInvariants([]);
    }
  }

  useEffect(() => {
    fetchInvariants();
  }, [activeTab]);

  // Detectar si es móvil
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function openEdit(inv: any, idx: number) {
    setEditInvariantId(inv.id + 1); // el id en la tabla es idx+1
    setEditInvariantName(inv.name);
    setEditInvariantAsker(inv.asker);
    setEditInvariantType(String(inv.type));
    setEditInvariantRule(String(inv.rule));
    setEditInvariantValue(
      String(inv.type) === "4"
        ? inv.value.endsWith("1") ? "1" : "0"
        : formatInvariantValue(inv.value, String(inv.type))
    );
    setEditError("");
    setOpenEditModal(true);
  }

  async function handleUpdateInvariant() {
    setEditError("");
    if (!editInvariantName.trim()) {
      setEditError("Set a name for the invariant");
      return;
    }
    if (!isHexAddress(editInvariantAsker)) {
      setEditError("Asker Address must be a valid hexadecimal address (0x + 40 hexadecimal characters)");
      return;
    }
    if (!editInvariantType) {
      setEditError("You must select a type");
      return;
    }
    if (!editInvariantRule) {
      setEditError("You must select a rule");
      return;
    }
    if (editInvariantType === "1") {
      if (!isUint(editInvariantValue)) {
        setEditError("Invariant Value must be a positive integer (UINT)");
        return;
      }
    } else if (editInvariantType === "2") {
      if (!isInt(editInvariantValue)) {
        setEditError("Invariant Value must be an integer (INT)");
        return;
      }
    } else if (editInvariantType === "3") {
      if (!isHexAddress(editInvariantValue)) {
        setEditError("Invariant Value must be a valid hexadecimal address (0x + 40 hexadecimal characters)");
        return;
      }
    } else if (editInvariantType === "4") {
      if (!(editInvariantValue === "1" || editInvariantValue === "0")) {
        setEditError("Invariant Value must be True (1) or False (0)");
        return;
      }
    } else if (editInvariantType === "5") {
      if (!isHex32(editInvariantValue)) {
        setEditError("Invariant Value must be a 32-byte hexadecimal (0x + 64 hexadecimal characters)");
        return;
      }
    }
    try {
      if (!activeTab) {
        setEditError("No contract selected");
        return;
      }
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setEditError("MetaMask is not installed");
        return;
      }
      const client = createWalletClient({
        chain: mantleSepoliaTestnet,
        transport: custom((window as any).ethereum),
      });
      let valueToSend: `0x${string}`;
      if (editInvariantType === "3") {
        // ADDRESS: convertir a bytes32 (pad a 32 bytes)
        const address0x = to0xString(editInvariantValue, 40);
        valueToSend = pad(address0x, { size: 32 }) as `0x${string}`;
      } else if (editInvariantType === "4") {
        // BOOL: enviar como bytes32 (0x + 63 ceros + 1 o 0)
        valueToSend = `0x${'0'.repeat(63)}${editInvariantValue}` as `0x${string}`;
      } else if (editInvariantType === "5") {
        // BYTES32: asegurar formato 0x + 64 caracteres
        valueToSend = to0xString(editInvariantValue, 64);
      } else {
        // UINT, INT: como antes
        valueToSend = pad(numberToHex(Number(editInvariantValue)), { size: 32 }) as `0x${string}`;
      }
      const txHash = await client.writeContract({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        functionName: "Update_Invariant",
        account: address as `0x${string}`,
        args: [
          BigInt(editInvariantId!),
          editInvariantName,
          editInvariantAsker as `0x${string}`,
          Number(editInvariantType),
          Number(editInvariantRule),
          valueToSend,
        ],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      const events = await publicClient.getContractEvents({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        eventName: "Invariant_updated",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      if (events && events.length > 0) {
        setToast("Invariant updated successfully!");
        setOpenEditModal(false);
        fetchInvariants();
      }else if (receipt.status === "reverted") {
        
        // Mostrar error como toast
        setOpenEditModal(false);
        setToast({ type: "error", message: "Update Failed: Invariant Should be disabled" });
      }else {
        // Mostrar error como toast
        setOpenEditModal(false);
        setToast({ type: "error", message: "Update failed: Event not emitted by contract" });
      } 
    } catch (err: any) {
      // Mostrar error como toast
      setOpenEditModal(false);
      setToast({ type: "error", message: err?.shortMessage || "Failed to update invariant" });
    }
  }

  async function handleToggleInvariant(id: number, enabled: boolean) {
    setToggleLoadingId(id);
    try {
      if (!activeTab) {
        setToast({ type: "error", message: "No contract selected" });
        setToggleLoadingId(null);
        return;
      }
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setToast({ type: "error", message: "MetaMask is not installed" });
        setToggleLoadingId(null);
        return;
      }
      const client = createWalletClient({
        chain: mantleSepoliaTestnet,
        transport: custom((window as any).ethereum),
      });
      // El ABI requiere: id (uint256), _isEnable (bool)
      const txHash = await client.writeContract({
        address: activeTab as `0x${string}`,
        abi: zEnforcerAbi,
        functionName: "Disable_Invariant",
        account: address as `0x${string}`,
        args: [BigInt(id), !enabled], // Cambia el estado
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status === "success") {
        setToast("Invariant Disabled successfully!");
        fetchInvariants();
      } else {
        setToast({ type: "error", message: "Error: Transaction reverted" });
      }
    } catch (err: any) {
      setToast({ type: "error", message: err?.shortMessage || "Failed to toggle invariant" });
    } finally {
      setToggleLoadingId(null);
    }
  }

  // Filtrado y ordenamiento de invariants
  const filteredInvariants = invariants
    .filter(inv => showDisabled || inv.enabled)
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else if (sortBy === 'type') {
        aVal = Number(a.type);
        bVal = Number(b.type);
      } else if (sortBy === 'rule') {
        aVal = Number(a.rule);
        bVal = Number(b.rule);
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 font-sans text-slate-800 text-sm">
      <div className="p-8 w-full h-full  bg-blue-50 flex flex-col items-center mt-16">
        {/* Toast notification below navbar */}
        {toast && (
          typeof toast === "string" ? (
            <div className="fixed left-1/2 transform -translate-x-1/2 top-20 z-50 bg-green-100 border border-green-300 text-green-900 px-6 py-3 rounded shadow-lg font-bold flex items-center gap-4 min-w-[300px] max-w-[90vw] animate-fade-in">
              <span className="flex-1">{toast}</span>
              <button
                className="ml-2 text-green-900 hover:text-green-700 text-lg font-bold focus:outline-none"
                onClick={() => setToast("")}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ) : toast?.type === "error" ? (
            <div className="fixed left-1/2 transform -translate-x-1/2 top-20 z-50 bg-red-100 border border-red-300 text-red-900 px-6 py-3 rounded shadow-lg font-bold flex items-center gap-4 min-w-[300px] max-w-[90vw] animate-fade-in">
              <span className="flex-1">{toast.message}</span>
              <button
                className="ml-2 text-red-900 hover:text-red-700 text-lg font-bold focus:outline-none"
                onClick={() => setToast("")}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ) : null
        )}
        <div className="mb-8 w-full">
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: '#1e293b' }}>
            Invariants Configuration
          </h2>
          <p className="text-sm text-slate-500 text-center mb-4">Admin & Edit your Smart Contract's Rules.</p>
          <div className="flex justify-between mb-4 w-full md:justify-between gap-2">
            <button
              className="px-4 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-sm transition-all border border-blue-900 shadow flex items-center gap-2"
              onClick={() => setOpenDeployModal(true)}
            >
              Deploy Invariants Contract
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-sm transition-all border border-blue-900 shadow flex items-center gap-2"
              onClick={() => setOpenCreateModal(true)}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
              Create Invariant
            </button>
          </div>
          <Modal open={openDeployModal} onClose={() => { setOpenDeployModal(false); setDeployError(""); setDeploySuccess(""); }} title="Deploy Invariants Contract" >
            <div className="flex flex-col gap-4 ">
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Configurer Address:</span>
                <input
                  type="text"
                  className="border border-blue-200 rounded px-3 py-2 text-sm font-mono"
                  placeholder="0x..."
                  value={deployConfigurer}
                  onChange={e => setDeployConfigurer(e.target.value)}
                />
              </label>
              {deployError && (<div className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-3 rounded relative" role="warning">
                <strong className="font-bold">Warning: </strong>
                <span className="block sm:inline">{deployError}</span>
              </div>)}
              <button
                className="w-full px-4 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-sm transition-all border border-blue-900 shadow mt-2"
                onClick={handleDeploy}
              >
                Deploy
              </button>
            </div>
          </Modal>
          <Modal open={openCreateModal} onClose={() => { setOpenCreateModal(false); setCreateError(""); }} title="Create Invariant">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Name:</span>
                <input
                  type="text"
                  className="border border-blue-200 rounded px-3 py-2 text-sm"
                  value={invariantName}
                  onChange={e => setInvariantName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Asker Address:</span>
                <input
                  type="text"
                  className="border border-blue-200 rounded px-3 py-2 text-sm font-mono"
                  placeholder="0x..."
                  value={invariantAsker}
                  onChange={e => setInvariantAsker(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Type:</span>
                <select
                  className="border border-blue-200 rounded px-3 py-2 text-sm"
                  value={invariantType}
                  onChange={e => {
                    setInvariantType(e.target.value);
                    setInvariantRule("");
                  }}
                >
                  <option value="">Select a type</option>
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Rule:</span>
                <select
                  className="border border-blue-200 rounded px-3 py-2 text-sm"
                  value={invariantRule}
                  onChange={e => setInvariantRule(e.target.value)}
                  disabled={!invariantType}
                >
                  <option value="">Select a rule</option>
                  {(invariantType === "4" ? boolRuleOptions : ruleOptions).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Invariant Value:</span>
                {invariantType === "4" ? (
                  <select
                    className="border border-blue-200 rounded px-3 py-2 text-sm font-sans"
                    value={invariantValue}
                    onChange={e => setInvariantValue(e.target.value)}
                  >
                    <option value="">Select value</option>
                    <option value="1">True</option>
                    <option value="0">False</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="border border-blue-200 rounded px-3 py-2 text-sm font-mono"
                    value={invariantValue}
                    onChange={e => setInvariantValue(e.target.value)}
                  />
                )}
              </label>
              {createError && (<div className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-3 rounded relative" role="warning">
                <strong className="font-bold">Warning: </strong>
                <span className="block sm:inline">{createError}</span>
              </div>)
              }
              <button
                className="w-full px-4 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-sm transition-all border border-blue-900 shadow mt-2"
                onClick={handleCreateInvariant}
              >
                Create Invariant
              </button>
            </div>
          </Modal>
          {/* Tabs for deployed contracts */}
          {deployedContracts.length > 0 && (
            <div className="flex gap-0.5 mb-4 border-b border-yellow-500  overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 px-1 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              {deployedContracts.map(addr => (
                <button
                  key={addr}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-t-xl font-sans border-x-2 transition-all duration-200 shadow-sm whitespace-nowrap
                    ${activeTab === addr
                      ? 'bg-white border-blue-900 text-blue-950 shadow-lg z-10'
                      : 'bg-blue-50 border-transparent text-blue-900 hover:bg-blue-200 hover:text-blue-950'}
                  `}
                  style={{ minWidth: 110 }}
                  onClick={() => setActiveTab(addr)}
                >
                  <span className="tracking-tight text-sm sm:text-sm">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                </button>
              ))}
            </div>
          )}
          {/* Filtros y ordenamiento */}
          <div className="flex flex-col sm:flex-row gap-2 mb-2 items-start sm:items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDisabled}
                onChange={e => setShowDisabled(e.target.checked)}
                className="accent-blue-600"
              />
              Mostrar invariants desactivadas
            </label>
            <label className="flex items-center gap-2 text-sm">
              Ordenar por:
              <select
                className="border border-blue-200 rounded px-2 py-1 text-sm"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="id">ID</option>
                <option value="type">Tipo</option>
                <option value="rule">Regla</option>
              </select>
              <button
                className="ml-1 px-2 py-1 border border-blue-200 rounded text-xs bg-blue-50 hover:bg-blue-100"
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                type="button"
                title="Cambiar orden"
              >
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </button>
            </label>
          </div>
          {/* Table only visible if a tab is selected or no contracts yet */}
          {(activeTab || deployedContracts.length === 0) && (
            <div className="overflow-x-auto rounded-lg border border-blue-200 shadow w-full mb-4">
              <table className="min-w-full text-sm bg-white rounded-xl overflow-hidden border border-blue-200 shadow-lg" style={{ color: '#1e293b' }}>
                <thead className="sticky top-0 z-20 bg-blue-100 border-b border-blue-200">
                  <tr className="">
                    <th className="px-3 py-2 whitespace-nowrap text-center">ID</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Name</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Asker Address</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Type</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Rule</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Value</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Enable / Disable</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvariants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-slate-500">No invariants found.</td>
                    </tr>
                  ) : (
                    filteredInvariants.map((inv, idx) => (
                      <tr key={inv.id} className="hover:bg-blue-50 transition-colors border-b border-blue-100 last:border-0">
                        <td className="px-3 py-2 whitespace-nowrap text-center font-semibold text-black">{inv.id + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">{inv.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center font-mono text-xs">
                          {isMobile ? shortAddress(inv.asker) : inv.asker}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">{typeOptions.find(t => t.value === String(inv.type))?.label || inv.type}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">{ruleOptions.find(r => r.value === String(inv.rule))?.label || inv.rule}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center font-mono text-xs">
                          {isMobile && (String(inv.type) === "3" || String(inv.type) === "5")
                            ? shortBytes32(formatInvariantValue(inv.value, String(inv.type)))
                            : formatInvariantValue(inv.value, String(inv.type))}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border ${inv.enabled ? 'bg-green-400 border-green-500' : 'bg-gray-200 border-gray-300'} ${toggleLoadingId === inv.id + 1 ? 'opacity-60 cursor-wait' : ''}`}
                            onClick={() => handleToggleInvariant(inv.id + 1, inv.enabled)}
                            disabled={toggleLoadingId === inv.id + 1}
                            title={inv.enabled ? "Disable Invariant" : "Enable Invariant"}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${inv.enabled ? 'translate-x-5' : 'translate-x-1'}`}
                            />
                            {toggleLoadingId === inv.id + 1 && (
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-blue-900">...</span>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center justify-end">
                          <button
                            className="px-3 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-xs transition-all border border-blue-900 shadow flex items-center justify-center"
                            onClick={() => openEdit(inv, idx)}
                          >
                            Edit Invariant
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* Mensaje informativo debajo de la tabla */}
          {deployedContracts.length === 0 && (
            <div className="flex items-center justify-center bg-blue-100 border border-blue-400 text-violet-950 rounded-lg px-4 py-3 mb-4 w-full max-w-2xl mx-auto space-x-1">
              <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01"/></svg>
              <span className="text-base">You must first deploy an Invariants contract.<br />
                Make sure you are whitelisted before deploying.</span>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-slate-500 text-center">Welcome. This is your Control Panel.</p>
      </div>
      {/* Modal Edit Invariant */}
      <Modal open={openEditModal} onClose={() => { setOpenEditModal(false); setEditError(""); }} title="Edit Invariant">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Name:</span>
            <input
              type="text"
              className="border border-blue-200 rounded px-3 py-2 text-sm"
              value={editInvariantName}
              onChange={e => setEditInvariantName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Asker Address:</span>
            <input
              type="text"
              className="border border-blue-200 rounded px-3 py-2 text-sm font-mono"
              placeholder="0x..."
              value={editInvariantAsker}
              onChange={e => setEditInvariantAsker(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Type:</span>
            <select
              className="border border-blue-200 rounded px-3 py-2 text-sm"
              value={editInvariantType}
              onChange={e => {
                setEditInvariantType(e.target.value);
                setEditInvariantRule("");
              }}
            >
              <option value="">Select a type</option>
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Rule:</span>
            <select
              className="border border-blue-200 rounded px-3 py-2 text-sm"
              value={editInvariantRule}
              onChange={e => setEditInvariantRule(e.target.value)}
              disabled={!editInvariantType}
            >
              <option value="">Select a rule</option>
              {(editInvariantType === "4" ? boolRuleOptions : ruleOptions).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Invariant Value:</span>
            {editInvariantType === "4" ? (
              <select
                className="border border-blue-200 rounded px-3 py-2 text-sm font-sans"
                value={editInvariantValue}
                onChange={e => setEditInvariantValue(e.target.value)}
              >
                <option value="">Select value</option>
                <option value="1">True</option>
                <option value="0">False</option>
              </select>
            ) : (
              <input
                type="text"
                className="border border-blue-200 rounded px-3 py-2 text-sm font-mono"
                value={editInvariantValue}
                onChange={e => setEditInvariantValue(e.target.value)}
              />
            )}
          </label>
          {editError && (<div className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-3 rounded relative" role="warning">
            <strong className="font-bold">Warning: </strong>
            <span className="block sm:inline">{editError}</span>
          </div>)}
          <button
            className="w-full px-4 py-2 bg-gradient-to-r from-[#1d293b] to-[#2451b1] hover:from-[#0c399a] hover:to-[#c39517] text-white rounded-lg font-sans text-sm transition-all border border-blue-900 shadow mt-2"
            onClick={handleUpdateInvariant}
          >
            Update Invariant
          </button>
        </div>
      </Modal>
    </div>
  );
} 

