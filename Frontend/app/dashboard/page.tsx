"use client";

import { useState, useEffect } from "react";
import { type Address } from "viem";
import { useWallet } from "../components/WalletContext";
import { contractService } from "../services/contractService";
import { useToast } from "../hooks/useToast";
import { useResponsive } from "../hooks/useResponsive";
import { validateInvariantForm, validateHexAddress } from "../utils/validation";
import { formatAddress, formatInvariantValue, formatBytes32, shortenMiddle } from "../utils/formatting";
import { TYPE_OPTIONS, RULE_OPTIONS, BOOL_RULE_OPTIONS } from "../constants";
import type { Invariant, InvariantFormData } from "../types";

// UI Components
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Toast from "../components/ui/Toast";
import { EditIcon, TrashIcon, LoadingSpinner } from "../components/icons";

export default function Dashboard() {
  const { address } = useWallet();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { isMobile } = useResponsive();

  // State
  const [deployedContracts, setDeployedContracts] = useState<Address[]>([]);
  const [activeTab, setActiveTab] = useState<Address | null>(null);
  const [invariants, setInvariants] = useState<Invariant[]>([]);
  
  // Modal states
  const [openDeployModal, setOpenDeployModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  
  // Form states
  const [deployConfigurer, setDeployConfigurer] = useState("");
  const [formData, setFormData] = useState<InvariantFormData>({
    name: "",
    asker: "",
    type: "",
    rule: "",
    value: "",
  });
  const [editData, setEditData] = useState<InvariantFormData & { id: number }>({
    id: 0,
    name: "",
    asker: "",
    type: "",
    rule: "",
    value: "",
  });
  
  // Loading states
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
  
  // Filters and sorting
  const [showDisabled, setShowDisabled] = useState(true);
  const [sortBy, setSortBy] = useState<'id' | 'type' | 'rule'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Effects
  useEffect(() => {
    if (address) {
      fetchDeployedContracts();
    }
  }, [address]);

  useEffect(() => {
    if (activeTab) {
      fetchInvariants();
    }
  }, [activeTab]);



  // Fetch functions
  async function fetchDeployedContracts() {
    if (!address) return;
    
    try {
      const contracts = await contractService.getContractsDeployedByUser(address as Address);
      setDeployedContracts(contracts);
      if (contracts.length > 0) {
        setActiveTab(contracts[0]);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  }

  async function fetchInvariants() {
    if (!activeTab) return;
    
    try {
      const invariantsData = await contractService.getInvariants(activeTab);
      // Consultar el estado real de cada invariant
      const invariantsWithStatus = await Promise.all(
        invariantsData.map(async (inv) => {
          const enabled = await contractService.isInvariantActive(activeTab, inv.id);
          return { ...inv, enabled };
        })
      );
      setInvariants(invariantsWithStatus);
    } catch (error) {
      console.error("Error fetching invariants:", error);
      setInvariants([]);
    }
  }

  // Handler functions
  async function handleDeploy() {
    const validation = validateHexAddress(deployConfigurer);
    if (!validation.isValid) {
      showError(validation.error || "Invalid address");
      return;
    }

    setIsDeploying(true);
    try {
      await contractService.deployInvariantsContract(deployConfigurer as Address);
      showSuccess("Contract deployed successfully!");
      setOpenDeployModal(false);
      setDeployConfigurer("");
      fetchDeployedContracts();
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to deploy contract";
      showError(errorMessage);
      console.error("Deploy error:", error);
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleCreateInvariant() {
    const validation = validateInvariantForm(formData);
    if (!validation.isValid) {
      showError(validation.error || "Invalid form data");
      return;
    }

    if (!activeTab) {
      showError("No contract selected");
      return;
    }

    setIsCreating(true);
    try {
      await contractService.createInvariant(activeTab, formData);
      showSuccess("Invariant created successfully!");
      setOpenCreateModal(false);
      resetFormData();
      fetchInvariants();
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to create invariant";
      showError(errorMessage);
      console.error("Create error:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateInvariant() {
    const { id, ...data } = editData;
    const validation = validateInvariantForm(data);
    if (!validation.isValid) {
      showError(validation.error || "Invalid form data");
      return;
    }

    if (!activeTab) {
      showError("No contract selected");
      return;
    }

    setIsUpdating(true);
    try {
      await contractService.updateInvariant(activeTab, id, data);
      showSuccess("Invariant updated successfully!");
      setOpenEditModal(false);
      fetchInvariants();
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to update invariant";
      showError(errorMessage);
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  // Handler para el toggle
  async function handleToggleInvariant(id: number, currentEnabled: boolean) {
    if (!activeTab) return;
    setToggleLoadingId(id);
    try {
      // Llama a la función del contrato para cambiar el estado
      await contractService.disableInvariant(activeTab, id, !currentEnabled);
      // Vuelve a consultar el estado real
      const actualStatus = await contractService.isInvariantActive(activeTab, id);
      setInvariants(prev => prev.map(inv => inv.id === id ? { ...inv, enabled: actualStatus } : inv));
      showSuccess(`Invariant ${actualStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to toggle invariant";
      showError(errorMessage);
      console.error("Toggle error:", error);
    } finally {
      setToggleLoadingId(null);
    }
  }

  // Utility functions
  function resetFormData() {
    setFormData({
      name: "",
      asker: "",
      type: "",
      rule: "",
      value: "",
    });
  }

  function handleOpenEditModal(invariant: Invariant) {
    setEditData({
      id: invariant.id,
      name: invariant.name,
      asker: invariant.asker,
      type: invariant.type,
      rule: invariant.rule,
      value: formatInvariantValue(invariant.value, invariant.type),
    });
    setOpenEditModal(true);
  }

  // Filter and sort invariants
  const filteredAndSortedInvariants = invariants
    .filter(inv => (showDisabled || inv.enabled))
    .filter(inv => {
      const isZero = (val: string) => val === '0' || val === '0x0' || /^0x0{1,}$/i.test(val) || /^0x0{40,}$/i.test(val);
      return !(isZero(inv.asker) && isZero(inv.value));
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'rule':
          comparison = a.rule.localeCompare(b.rule);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getRuleOptions = (type: string) => {
    return type === "4" ? BOOL_RULE_OPTIONS : RULE_OPTIONS;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-200 pt-20 px-4">
      <div className="max-w-full w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Invariants Configuration</h1>
          <p className="text-slate-600">Manage your invariant contracts and rules</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
          <Button
            onClick={() => setOpenDeployModal(true)}
            className="flex items-center gap-2"
          >
            Deploy Invariant Contract
          </Button>
          {activeTab && (
            <Button
              onClick={() => setOpenCreateModal(true)}
              className="flex items-center gap-2 px-6 py-2 font-bold bg-gradient-to-r from-yellow-400 to-orange-300 hover:from-yellow-500 hover:to-orange-400 text-slate-900 shadow rounded-lg transition-all"
              style={{ boxShadow: '0 2px 8px 0 rgba(255, 193, 7, 0.15)' }}
            >
              + Create Invariant
            </Button>
          )}
        </div>

        {/* Contract Tabs */}
        {deployedContracts.length > 0 && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {deployedContracts.map((contract) => (
                  <button
                    key={contract}
                    onClick={() => setActiveTab(contract)}
                    className={`
                      whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                      ${activeTab === contract
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {formatAddress(contract)}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Invariants Section */}
        {activeTab && (
          <div className="bg-white/80 rounded-lg shadow-lg p-6 w-full">
            {/* Filters and Controls */}
            <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={showDisabled}
                    onChange={(e) => setShowDisabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:outline-none transition-all"
                  />
                  Show disabled
                </label>
                
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'id' | 'type' | 'rule')}
                  options={[
                    { label: "Sort by ID", value: "id" },
                    { label: "Sort by Type", value: "type" },
                    { label: "Sort by Rule", value: "rule" },
                  ]}
                  className="w-32 text-slate-800 bg-white border border-blue-300"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-blue-50 border border-blue-300 text-blue-900 hover:bg-blue-200 hover:text-blue-900 px-2 py-1 rounded transition-all"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Invariants Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">ID</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Asker</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Type</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Rule</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Value</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-blue-950 uppercase tracking-wider min-w-0">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedInvariants.map((invariant) => (
                    <tr key={invariant.id}>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0">{invariant.id}</td>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0 break-all" title={invariant.name}>{invariant.name}</td>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0 break-all" title={invariant.asker}>
                        {isMobile
                          ? <div className="truncate">{shortenMiddle(invariant.asker)}</div>
                          : <div>{invariant.asker}</div>
                        }
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0">{TYPE_OPTIONS.find(opt => opt.value === invariant.type)?.label}</td>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0">{RULE_OPTIONS.find(opt => opt.value === invariant.rule)?.label}</td>
                      <td className="px-2 py-4 text-sm text-gray-900 text-center min-w-0 break-all" title={
                        invariant.type === "5" 
                          ? formatBytes32(formatInvariantValue(invariant.value, invariant.type))
                          : formatInvariantValue(invariant.value, invariant.type)
                      }>
                        {isMobile
                          ? <div className="truncate">{
                              shortenMiddle(
                                invariant.type === "5"
                                  ? formatBytes32(formatInvariantValue(invariant.value, invariant.type))
                                  : formatInvariantValue(invariant.value, invariant.type)
                              )
                            }</div>
                          : <div>{
                              invariant.type === "5"
                                ? formatBytes32(formatInvariantValue(invariant.value, invariant.type))
                                : formatInvariantValue(invariant.value, invariant.type)
                            }</div>
                        }
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleInvariant(invariant.id, !!invariant.enabled)}
                            disabled={toggleLoadingId === invariant.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              invariant.enabled 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            } ${toggleLoadingId === invariant.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                invariant.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                            {toggleLoadingId === invariant.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner />
                              </div>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(invariant)}
                            className="flex items-center gap-1"
                          >
                            <EditIcon />
                            Edit
                          </Button>
                          
                          {/* The toggle button is now part of the status cell */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAndSortedInvariants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No invariants found
                </div>
              )}
            </div>
          </div>
        )}

        {deployedContracts.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No contracts deployed</h2>
            <p className="text-gray-600 mb-4">Deploy your first contract to get started</p>
            <Button onClick={() => setOpenDeployModal(true)}>
              Deploy Contract
            </Button>
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      <Modal
        open={openDeployModal}
        onClose={() => setOpenDeployModal(false)}
        title="Deploy New Contract"
      >
        <div className="space-y-4">
          <Input
            label="Configurer Address"
            value={deployConfigurer}
            onChange={(e) => setDeployConfigurer(e.target.value)}
            placeholder="0x..."
            helpText="Address that will have permission to configure the contract"
          />
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDeploy}
              isLoading={isDeploying}
              className="flex-1"
            >
              Deploy Contract
            </Button>
            <Button
              variant="secondary"
              onClick={() => setOpenDeployModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Invariant Modal */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Create New Invariant"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter invariant name"
          />
          
          <Input
            label="Asker Address"
            value={formData.asker}
            onChange={(e) => setFormData(prev => ({ ...prev, asker: e.target.value }))}
            placeholder="0x..."
          />
          
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, rule: "", value: "" }))}
            options={TYPE_OPTIONS}
            placeholder="Select type"
          />
          
          {formData.type && (
            <Select
              label="Rule"
              value={formData.rule}
              onChange={(e) => setFormData(prev => ({ ...prev, rule: e.target.value }))}
              options={getRuleOptions(formData.type)}
              placeholder="Select rule"
            />
          )}
          
          {formData.type && (
            <Input
              label="Value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder={
                formData.type === "1" ? "Enter number" :
                formData.type === "2" ? "Enter integer" :
                formData.type === "3" ? "0x..." :
                formData.type === "4" ? "true/false" :
                formData.type === "5" ? "0x..." : "Enter value"
              }
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateInvariant}
              isLoading={isCreating}
              className="bg-gradient-to-r from-yellow-400 to-orange-300 hover:from-yellow-500 hover:to-orange-400 text-slate-900 font-bold shadow px-6 py-2 rounded-lg transition-all flex-1"
              style={{ boxShadow: '0 2px 8px 0 rgba(255, 193, 7, 0.15)' }}
            >
              Create Invariant
            </Button>
            <Button
              variant="secondary"
              onClick={() => setOpenCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Invariant Modal */}
      <Modal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Edit Invariant"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter invariant name"
          />
          
          <Input
            label="Asker Address"
            value={editData.asker}
            onChange={(e) => setEditData(prev => ({ ...prev, asker: e.target.value }))}
            placeholder="0x..."
          />
          
          <Select
            label="Type"
            value={editData.type}
            onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value, rule: "", value: "" }))}
            options={TYPE_OPTIONS}
          />
          
          {editData.type && (
            <Select
              label="Rule"
              value={editData.rule}
              onChange={(e) => setEditData(prev => ({ ...prev, rule: e.target.value }))}
              options={getRuleOptions(editData.type)}
            />
          )}
          
          {editData.type && (
            <Input
              label="Value"
              value={editData.value}
              onChange={(e) => setEditData(prev => ({ ...prev, value: e.target.value }))}
              placeholder={
                editData.type === "1" ? "Enter number" :
                editData.type === "2" ? "Enter integer" :
                editData.type === "3" ? "0x..." :
                editData.type === "4" ? "true/false" :
                editData.type === "5" ? "0x..." : "Enter value"
              }
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
            onClick={handleUpdateInvariant}
              isLoading={isUpdating}
              className="flex-1"
          >
            Update Invariant
            </Button>
            <Button
              variant="secondary"
              onClick={() => setOpenEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast}
          onClose={hideToast}
        />
      )}
    </div>
  );
} 

