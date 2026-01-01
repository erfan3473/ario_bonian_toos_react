// src/utils/contractCalculations.js

export const calculateMonthlyEquivalent = (contract, schemeContract = null) => {
  if (!contract) return 0;

  if (
    contract.contract_type === 'EMPLOYMENT' && 
    schemeContract && 
    schemeContract.total_monthly_wage_benefits
  ) {
    return Number(schemeContract.total_monthly_wage_benefits);
  }

  if (contract.monthly_salary && contract.monthly_salary > 0) {
    return Number(contract.monthly_salary);
  }

  if (contract.daily_wage && contract.daily_wage > 0) {
    return Number(contract.daily_wage) * 30;
  }

  if (contract.contract_value && contract.contract_value > 0) {
    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : new Date();
    const diffMonths = Math.max(
      1, 
      Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30))
    );
    return Number(contract.contract_value) / diffMonths;
  }

  return 0;
};

const getContractLabel = (contract, schemeContract) => {
  if (!contract) return '---';

  const projectName = contract.project_name || 'پروژه نامشخص';

  if (schemeContract) {
    return `قرارداد طرح طبقه‌بندی - ${projectName}`;
  }
  if (contract.monthly_salary && contract.monthly_salary > 0) {
    return `حقوق ماهانه ثابت - ${projectName}`;
  }
  if (contract.daily_wage && contract.daily_wage > 0) {
    return `روزمزد - ${projectName}`;
  }
  if (contract.contract_value && contract.contract_value > 0) {
    return `قرارداد پیمانکاری - ${projectName}`;
  }
  return projectName;
};

export const calculateTotalMonthlyIncome = (contracts = [], schemeContracts = []) => {
  let total = 0;
  const breakdown = [];

  if (!contracts || !Array.isArray(contracts)) {
    return { total: 0, breakdown: [] };
  }

  const activeContracts = contracts.filter(c => c && c.is_active);

  activeContracts.forEach(contract => {
    const schemeContract = schemeContracts && Array.isArray(schemeContracts)
      ? schemeContracts.find(sc => sc && sc.contract === contract.id)
      : null;
    
    const amount = calculateMonthlyEquivalent(contract, schemeContract);
    
    if (amount > 0) {
      total += amount;
      breakdown.push({
        contractId: contract.id,
        projectName: contract.project_name || 'پروژه نامشخص',
        type: contract.contract_type || 'EMPLOYMENT',
        employmentType: contract.employment_type_description || null,
        amount: amount,
        hasScheme: !!schemeContract,
        label: getContractLabel(contract, schemeContract)
      });
    }
  });

  return { total, breakdown };
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
};
