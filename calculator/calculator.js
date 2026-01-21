// DOM Elements
const principalInput = document.getElementById('principal');
const interestRateInput = document.getElementById('interest-rate');
const rateTypeSelect = document.getElementById('rate-type');
const compoundingFrequencySelect = document.getElementById('compounding-frequency');
const contributionAmountInput = document.getElementById('contribution-amount');
const contributionFrequencySelect = document.getElementById('contribution-frequency');
const yearsInput = document.getElementById('years');
const monthsInput = document.getElementById('months');
const daysInput = document.getElementById('days');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const calculateBtn = document.getElementById('calculate-btn');
const resultsSection = document.getElementById('results');
const calculatorWrapper = document.querySelector('.calculator-wrapper');
const breakdownViewSelect = document.getElementById('breakdown-view');
const themeToggle = document.getElementById('theme-toggle');

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Regenerate chart with new theme colors if results are visible
    if (calculationData && growthChart) {
        generateChart(
            calculationData.principal,
            calculationData.rate,
            calculationData.compoundingFrequency,
            calculationData.contributionAmount,
            calculationData.contributionFrequency,
            calculationData.timeInYears
        );
    }
}

// Initialize theme on load
initTheme();

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Result elements
const finalAmountEl = document.getElementById('final-amount');
const totalContributionsEl = document.getElementById('total-contributions');
const contributionsCardEl = document.getElementById('contributions-card');
const totalInterestEl = document.getElementById('total-interest');
const calculationPeriodEl = document.getElementById('calculation-period');
const breakdownTableEl = document.getElementById('breakdown-table');
const growthChartCanvas = document.getElementById('growth-chart');
const formulaDisplayEl = document.getElementById('formula-display');
const formulaWithContributionsEl = document.getElementById('formula-with-contributions');

// Chart instance
let growthChart = null;

// Store calculation data for regenerating breakdown
let calculationData = null;

// Event Listeners
calculateBtn.addEventListener('click', calculate);

// Cmd+Enter or Ctrl+Enter to calculate from anywhere
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        calculate();
    }
});

// Update breakdown when view selection changes
breakdownViewSelect.addEventListener('change', () => {
    if (calculationData) {
        generateBreakdown(
            calculationData.principal,
            calculationData.rate,
            calculationData.compoundingFrequency,
            calculationData.contributionAmount,
            calculationData.contributionFrequency,
            calculationData.timeInYears,
            calculationData.startDate
        );
    }
});

// Convert entered rate to annual rate based on rate type
function convertToAnnualRate(rate, rateType) {
    switch (rateType) {
        case 'daily':
            return rate * 365;
        case 'monthly':
            return rate * 12;
        case 'quarterly':
            return rate * 4;
        case 'annual':
        default:
            return rate;
    }
}

// Calculate compound interest with regular contributions
// Uses the Future Value of Annuity formula for contributions
function calculateWithContributions(principal, periodRate, compoundingFreq, contributionAmount, contributionFreq, timeInYears) {
    // Calculate principal growth: A = P(1 + r)^n
    const numberOfPeriods = compoundingFreq * timeInYears;
    const principalGrowth = principal * Math.pow((1 + periodRate), numberOfPeriods);

    // If no contributions, return just principal growth
    if (contributionFreq === 0 || contributionAmount <= 0) {
        return {
            finalAmount: principalGrowth,
            totalContributions: 0,
            totalInterest: principalGrowth - principal,
            principalOnly: principalGrowth
        };
    }

    // Calculate contribution growth
    // For each contribution, calculate its future value based on remaining time
    // This handles different contribution and compounding frequencies correctly
    const totalContributionPeriods = contributionFreq * timeInYears;
    const contributionPeriodInYears = 1 / contributionFreq;

    let contributionGrowth = 0;
    for (let i = 1; i <= totalContributionPeriods; i++) {
        // Time remaining for this contribution to grow
        const contributionTime = i * contributionPeriodInYears;
        const remainingTime = timeInYears - contributionTime;

        if (remainingTime >= 0) {
            // Calculate how much this contribution grows
            const periodsRemaining = compoundingFreq * remainingTime;
            const contributionFV = contributionAmount * Math.pow((1 + periodRate), periodsRemaining);
            contributionGrowth += contributionFV;
        }
    }

    const totalContributions = contributionAmount * totalContributionPeriods;
    const finalAmount = principalGrowth + contributionGrowth;
    const totalInterest = finalAmount - principal - totalContributions;

    return {
        finalAmount,
        totalContributions,
        totalInterest,
        principalOnly: principalGrowth
    };
}

// Set start date to today by default
function setDefaultStartDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    startDateInput.value = `${year}-${month}-${day}`;
}

// Set default start date on page load
setDefaultStartDate();

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'compound-calculator-data';

function saveToLocalStorage() {
    const data = {
        principal: principalInput.value,
        interestRate: interestRateInput.value,
        rateType: rateTypeSelect.value,
        compoundingFrequency: compoundingFrequencySelect.value,
        contributionAmount: contributionAmountInput.value,
        contributionFrequency: contributionFrequencySelect.value,
        years: yearsInput.value,
        months: monthsInput.value,
        days: daysInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);

        if (data.principal) principalInput.value = data.principal;
        if (data.interestRate) interestRateInput.value = data.interestRate;
        if (data.rateType) rateTypeSelect.value = data.rateType;
        if (data.compoundingFrequency) compoundingFrequencySelect.value = data.compoundingFrequency;
        if (data.contributionAmount) contributionAmountInput.value = data.contributionAmount;
        if (data.contributionFrequency) contributionFrequencySelect.value = data.contributionFrequency;
        if (data.years) yearsInput.value = data.years;
        if (data.months) monthsInput.value = data.months;
        if (data.days) daysInput.value = data.days;
        if (data.startDate) startDateInput.value = data.startDate;
        if (data.endDate) endDateInput.value = data.endDate;

        return true;
    } catch (e) {
        console.error('Failed to load saved data:', e);
        return false;
    }
}

// Add change listeners to all inputs to auto-save
const allInputs = [
    principalInput, interestRateInput, rateTypeSelect, compoundingFrequencySelect,
    contributionAmountInput, contributionFrequencySelect,
    yearsInput, monthsInput, daysInput, startDateInput, endDateInput
];

allInputs.forEach(input => {
    input.addEventListener('input', saveToLocalStorage);
    input.addEventListener('change', saveToLocalStorage);
});

// Load saved data on page load (after default date is set)
if (loadFromLocalStorage()) {
    // Auto-calculate if we have enough data
    const hasAmount = parseFloat(principalInput.value) > 0 || parseFloat(contributionAmountInput.value) > 0;
    const hasTime = (parseInt(yearsInput.value) > 0 || parseInt(monthsInput.value) > 0 || parseInt(daysInput.value) > 0)
                   || (startDateInput.value && endDateInput.value);

    if (hasAmount && hasTime) {
        // Small delay to ensure DOM is ready
        setTimeout(calculate, 100);
    }
}

// Clear end date input when time period inputs change (but keep start date)
[yearsInput, monthsInput, daysInput].forEach(input => {
    input.addEventListener('input', () => {
        if (input.value) {
            endDateInput.value = '';
        }
    });
});

// Clear time period inputs when both start and end dates are selected
[startDateInput, endDateInput].forEach(input => {
    input.addEventListener('change', () => {
        // Only clear period inputs if BOTH dates are filled
        if (startDateInput.value && endDateInput.value) {
            yearsInput.value = '';
            monthsInput.value = '';
            daysInput.value = '';
        }
    });
});

function calculate() {
    // Show loading state
    calculateBtn.classList.add('loading');
    calculateBtn.disabled = true;

    setTimeout(() => {
        try {
            // Get inputs
            const principal = parseFloat(principalInput.value) || 0;
            const enteredRatePercent = parseFloat(interestRateInput.value) || 0;
            const rateType = rateTypeSelect.value;
            const compoundingFrequency = parseInt(compoundingFrequencySelect.value);
            const contributionAmount = parseFloat(contributionAmountInput.value) || 0;
            const contributionFrequency = parseInt(contributionFrequencySelect.value);

            // Validation
            if (principal <= 0 && contributionAmount <= 0) {
                alert('Please enter a principal amount or contribution amount');
                return;
            }

            if (enteredRatePercent < 0) {
                alert('Please enter a valid interest rate');
                return;
            }

            // Convert entered rate to annual rate, then to period rate
            const annualRatePercent = convertToAnnualRate(enteredRatePercent, rateType);
            const periodRatePercent = annualRatePercent / compoundingFrequency;

            // Calculate time period
            let timeInYears;
            let periodText;
            let startDate;
            let endDate;

            if (startDateInput.value && endDateInput.value) {
                // Use date range
                startDate = new Date(startDateInput.value);
                endDate = new Date(endDateInput.value);

                if (endDate <= startDate) {
                    alert('End date must be after start date');
                    return;
                }

                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                timeInYears = diffDays / 365;

                periodText = formatTimePeriod(diffDays);
            } else {
                // Use time period inputs
                const years = parseInt(yearsInput.value) || 0;
                const months = parseInt(monthsInput.value) || 0;
                const days = parseInt(daysInput.value) || 0;

                if (years === 0 && months === 0 && days === 0) {
                    alert('Please enter a time period or select dates');
                    return;
                }

                // Calculate start and end dates from today
                startDate = startDateInput.value ? new Date(startDateInput.value) : new Date();
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + years);
                endDate.setMonth(endDate.getMonth() + months);
                endDate.setDate(endDate.getDate() + days);

                timeInYears = years + (months / 12) + (days / 365);
                periodText = formatTimePeriodFromInputs(years, months, days);
            }

            // Calculate compound interest with contributions
            const periodRate = periodRatePercent / 100; // Convert percentage to decimal
            const results = calculateWithContributions(
                principal,
                periodRate,
                compoundingFrequency,
                contributionAmount,
                contributionFrequency,
                timeInYears
            );

            // Display results
            displayResults(
                principal,
                results.finalAmount,
                results.totalInterest,
                results.totalContributions,
                periodText,
                periodRate,
                compoundingFrequency,
                contributionAmount,
                contributionFrequency,
                timeInYears,
                startDate,
                endDate
            );

        } catch (error) {
            alert('An error occurred during calculation. Please check your inputs.');
            console.error(error);
        } finally {
            calculateBtn.classList.remove('loading');
            calculateBtn.disabled = false;
        }
    }, 300); // Small delay for better UX
}

function displayResults(principal, finalAmount, totalInterest, totalContributions, periodText, rate, compoundingFrequency, contributionAmount, contributionFrequency, timeInYears, startDate, endDate) {
    // Store calculation data
    calculationData = {
        principal,
        rate,
        compoundingFrequency,
        contributionAmount,
        contributionFrequency,
        timeInYears,
        startDate,
        endDate
    };

    // Format currency
    finalAmountEl.textContent = formatCurrency(finalAmount);
    totalInterestEl.textContent = formatCurrency(totalInterest);

    // Show/hide contributions card based on whether contributions are used
    const hasContributions = contributionFrequency > 0 && contributionAmount > 0;
    if (hasContributions) {
        totalContributionsEl.textContent = formatCurrency(totalContributions);
        contributionsCardEl.style.display = 'block';
        formulaDisplayEl.style.display = 'none';
        formulaWithContributionsEl.style.display = 'flex';
    } else {
        contributionsCardEl.style.display = 'none';
        formulaDisplayEl.style.display = 'flex';
        formulaWithContributionsEl.style.display = 'none';
    }

    // Display end date
    calculationPeriodEl.textContent = formatDateLong(endDate);

    // Set up breakdown view options based on compounding frequency and time period
    setupBreakdownViewOptions(compoundingFrequency, timeInYears);

    // Generate chart
    generateChart(principal, rate, compoundingFrequency, contributionAmount, contributionFrequency, timeInYears);

    // Generate breakdown table
    generateBreakdown(principal, rate, compoundingFrequency, contributionAmount, contributionFrequency, timeInYears, startDate);

    // Show results section and update layout
    calculatorWrapper.classList.add('has-results');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupBreakdownViewOptions(compoundingFrequency, timeInYears) {
    // Calculate total days
    const totalDays = timeInYears * 365;

    // Clear existing options
    breakdownViewSelect.innerHTML = '';

    // Define available options based on compounding frequency
    const allOptions = [
        { value: 'daily', label: 'Daily', minFreq: 365 },
        { value: 'weekly', label: 'Weekly', minFreq: 52 },
        { value: 'monthly', label: 'Monthly', minFreq: 12 },
        { value: 'quarterly', label: 'Quarterly', minFreq: 4 },
        { value: 'annually', label: 'Annually', minFreq: 1 }
    ];

    // Filter options based on compounding frequency (can only view at or above compound frequency)
    const availableOptions = allOptions.filter(option => option.minFreq <= compoundingFrequency);

    // Add options to select
    availableOptions.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        breakdownViewSelect.appendChild(optionEl);
    });

    // Auto-select default based on time period
    let defaultView;
    if (totalDays <= 30) {
        defaultView = 'daily';
    } else if (totalDays <= 90) {
        defaultView = 'weekly';
    } else if (totalDays <= 365) {
        defaultView = 'monthly';
    } else {
        defaultView = 'annually';
    }

    // Make sure the default view is available, otherwise use the finest available
    const isDefaultAvailable = availableOptions.some(opt => opt.value === defaultView);
    if (!isDefaultAvailable) {
        defaultView = availableOptions[0].value;
    }

    breakdownViewSelect.value = defaultView;
}

// Custom tooltip element
let chartTooltipEl = null;

function getOrCreateTooltip(chart) {
    if (!chartTooltipEl) {
        chartTooltipEl = document.createElement('div');
        chartTooltipEl.className = 'chart-tooltip';
        document.body.appendChild(chartTooltipEl);
    }
    return chartTooltipEl;
}

function externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    // Hide tooltip if not visible
    if (tooltip.opacity === 0) {
        tooltipEl.classList.remove('visible');
        return;
    }

    // Get theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const accentColor = '#c17f24';
    const baselineColor = isDark ? '#666666' : '#aaaaaa';

    // Build tooltip content
    if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const dataPoints = tooltip.dataPoints || [];

        let innerHtml = '';

        // Header with time label
        if (titleLines.length > 0) {
            innerHtml += `<div class="chart-tooltip-header">${titleLines[0]}</div>`;
        }

        // Data rows
        dataPoints.forEach((dataPoint, i) => {
            const dataset = dataPoint.dataset;
            const value = formatCurrency(dataPoint.parsed.y);
            const color = dataset.borderColor;
            const label = dataset.label === 'Total Balance' ? 'Balance' : 'Contributions';

            innerHtml += `
                <div class="chart-tooltip-row">
                    <span class="chart-tooltip-label">
                        <span class="chart-tooltip-dot" style="background: ${color}; ${dataset.borderDash ? 'border: 2px dashed ' + color + '; background: transparent;' : ''}"></span>
                        ${label}
                    </span>
                    <span class="chart-tooltip-value">${value}</span>
                </div>
            `;
        });

        // Interest earned indicator (if we have both datasets)
        if (dataPoints.length === 2) {
            const balance = dataPoints.find(d => d.dataset.label === 'Total Balance')?.parsed.y || 0;
            const baseline = dataPoints.find(d => d.dataset.label === 'Principal + Contributions')?.parsed.y || 0;
            const interest = balance - baseline;
            if (interest > 0) {
                innerHtml += `<div class="chart-tooltip-interest">Interest earned: <span>+${formatCurrency(interest)}</span></div>`;
            }
        }

        tooltipEl.innerHTML = innerHtml;
    }

    // Position tooltip
    const position = chart.canvas.getBoundingClientRect();
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;

    let left = position.left + window.scrollX + tooltip.caretX + 12;
    let top = position.top + window.scrollY + tooltip.caretY - tooltipHeight / 2;

    // Keep tooltip within viewport
    if (left + tooltipWidth > window.innerWidth - 20) {
        left = position.left + window.scrollX + tooltip.caretX - tooltipWidth - 12;
    }
    if (top < 10) {
        top = 10;
    }
    if (top + tooltipHeight > window.innerHeight - 10) {
        top = window.innerHeight - tooltipHeight - 10;
    }

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.classList.add('visible');
}

// Crosshair plugin
const crosshairPlugin = {
    id: 'crosshair',
    afterDraw: (chart) => {
        if (chart.tooltip?._active?.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
            ctx.stroke();
            ctx.restore();
        }
    }
};

// Dynamic gradient plugin - creates gradient that scales with chart area
const dynamicGradientPlugin = {
    id: 'dynamicGradient',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        gradient.addColorStop(0, isDark ? 'rgba(193, 127, 36, 0.35)' : 'rgba(193, 127, 36, 0.25)');
        gradient.addColorStop(0.5, isDark ? 'rgba(193, 127, 36, 0.12)' : 'rgba(193, 127, 36, 0.1)');
        gradient.addColorStop(1, 'rgba(193, 127, 36, 0)');

        const balanceDataset = chart.data.datasets.find(d => d.label === 'Total Balance');
        if (balanceDataset) {
            balanceDataset.backgroundColor = gradient;
        }
    }
};

function generateChart(principal, rate, compoundingFrequency, contributionAmount, contributionFrequency, timeInYears) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Destroy existing chart if it exists
    if (growthChart) {
        growthChart.destroy();
    }

    // More data points for smoother curves
    let dataPoints;
    if (timeInYears <= 1) {
        dataPoints = Math.max(12, Math.ceil(timeInYears * 52));
    } else if (timeInYears <= 5) {
        dataPoints = Math.max(24, Math.ceil(timeInYears * 12));
    } else if (timeInYears <= 20) {
        dataPoints = Math.max(40, Math.ceil(timeInYears * 4));
    } else {
        dataPoints = Math.min(Math.ceil(timeInYears * 2), 80);
    }
    dataPoints = Math.min(dataPoints, 100);
    let timeIncrement = timeInYears / dataPoints;

    const labels = [];
    const balanceData = [];
    const baselineData = []; // Principal + contributions (no interest)

    const hasContributions = contributionFrequency > 0 && contributionAmount > 0;

    // Generate data points
    for (let i = 0; i <= dataPoints; i++) {
        const currentTime = i * timeIncrement;

        // Calculate total balance with compound interest and contributions
        const results = calculateWithContributions(
            principal,
            rate,
            compoundingFrequency,
            contributionAmount,
            contributionFrequency,
            currentTime
        );

        // Calculate baseline (principal + contributions without interest)
        let baseline = principal;
        if (hasContributions) {
            const contributionsMade = Math.floor(contributionFrequency * currentTime);
            baseline = principal + (contributionAmount * contributionsMade);
        }

        // Create clean, minimal labels
        let label;
        if (timeInYears <= 0.25) {
            const days = Math.round(currentTime * 365);
            label = days === 0 ? 'Start' : `${days}d`;
        } else if (timeInYears <= 1) {
            const months = Math.round(currentTime * 12);
            label = months === 0 ? 'Start' : `${months}mo`;
        } else {
            const years = currentTime;
            if (years === 0) {
                label = 'Start';
            } else if (years < 1) {
                label = `${Math.round(years * 12)}mo`;
            } else {
                label = Number.isInteger(years) ? `${years}y` : `${years.toFixed(1)}y`;
            }
        }

        labels.push(label);
        balanceData.push(results.finalAmount);
        baselineData.push(baseline);
    }

    // Get theme-aware colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#666666' : '#999999';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const accentColor = '#c17f24';
    const baselineColor = isDark ? '#555555' : '#aaaaaa';

    const ctx = growthChartCanvas.getContext('2d');

    // Build datasets array
    const datasets = [];

    // Add baseline dataset if contributions are enabled
    if (hasContributions) {
        datasets.push({
            label: 'Principal + Contributions',
            data: baselineData,
            borderColor: baselineColor,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            pointHoverBorderColor: baselineColor,
            pointHoverBorderWidth: 3
        });
    }

    // Add main balance dataset
    datasets.push({
        label: 'Total Balance',
        data: balanceData,
        borderColor: accentColor,
        backgroundColor: 'transparent', // Dynamic gradient plugin will replace this
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHitRadius: 8,
        pointHoverBackgroundColor: accentColor,
        pointHoverBorderColor: isDark ? '#1a1a1a' : '#ffffff',
        pointHoverBorderWidth: 3
    });

    // Register plugins if not already registered
    if (!Chart.registry.plugins.get('crosshair')) {
        Chart.register(crosshairPlugin);
    }
    if (!Chart.registry.plugins.get('dynamicGradient')) {
        Chart.register(dynamicGradientPlugin);
    }

    // Create chart
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 1,
            layout: {
                padding: {
                    top: 24,
                    right: 24,
                    bottom: 16,
                    left: 16
                }
            },
            animation: {
                duration: 600,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: hasContributions,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'line',
                        boxWidth: 32,
                        boxHeight: 2,
                        padding: 20,
                        font: {
                            family: "'IBM Plex Mono', monospace",
                            size: 12,
                            weight: '500'
                        },
                        color: textColor
                    }
                },
                tooltip: {
                    enabled: false,
                    external: externalTooltipHandler,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grace: '15%',
                    ticks: {
                        maxTicksLimit: 7,
                        callback: function(value) {
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return '$' + Math.round(value / 1000) + 'K';
                            }
                            return '$' + value.toLocaleString();
                        },
                        color: textColor,
                        font: {
                            family: "'IBM Plex Mono', monospace",
                            size: 12
                        },
                        padding: 16
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: false,
                        lineWidth: 1
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                        color: textColor,
                        font: {
                            family: "'IBM Plex Mono', monospace",
                            size: 12
                        },
                        padding: 12
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                line: {
                    capBezierPoints: true
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length ? 'crosshair' : 'default';
            }
        }
    });
}

function generateBreakdown(principal, rate, compoundingFrequency, contributionAmount, contributionFrequency, timeInYears, startDate) {
    const viewMode = breakdownViewSelect.value;
    let periodLabel;
    let periodsToShow;
    let periodIncrement; // in years
    let periodIncrementDays; // in days for date calculation

    const hasContributions = contributionFrequency > 0 && contributionAmount > 0;

    // Determine period settings based on view mode
    switch(viewMode) {
        case 'daily':
            periodLabel = 'Date';
            periodIncrement = 1/365;
            periodIncrementDays = 1;
            periodsToShow = Math.min(Math.ceil(timeInYears * 365), 100);
            break;
        case 'weekly':
            periodLabel = 'Week Ending';
            periodIncrement = 7/365;
            periodIncrementDays = 7;
            periodsToShow = Math.min(Math.ceil(timeInYears * 365 / 7), 100);
            break;
        case 'monthly':
            periodLabel = 'Month';
            periodIncrement = 1/12;
            periodIncrementDays = null; // Use month increment instead
            periodsToShow = Math.min(Math.ceil(timeInYears * 12), 60);
            break;
        case 'quarterly':
            periodLabel = 'Quarter';
            periodIncrement = 0.25;
            periodIncrementDays = null; // Use month increment instead
            periodsToShow = Math.min(Math.ceil(timeInYears * 4), 40);
            break;
        case 'annually':
            periodLabel = 'Year';
            periodIncrement = 1;
            periodIncrementDays = null; // Use year increment instead
            periodsToShow = Math.min(Math.ceil(timeInYears), 30);
            break;
        default:
            periodLabel = 'Period';
            periodIncrement = 1/12;
            periodIncrementDays = null;
            periodsToShow = Math.min(Math.ceil(timeInYears * 12), 24);
    }

    let tableHTML = '<table class="breakdown-table"><thead><tr>';
    tableHTML += `<th>${periodLabel}</th>`;
    if (hasContributions) {
        tableHTML += '<th>Contribution</th>';
    }
    tableHTML += '<th>Balance</th>';
    tableHTML += '<th>Interest Earned</th>';
    tableHTML += '<th>Total Interest</th>';
    tableHTML += '</tr></thead><tbody>';

    let previousBalance = principal;
    let previousContributions = 0;

    for (let period = 1; period <= periodsToShow; period++) {
        const currentTime = Math.min(period * periodIncrement, timeInYears);

        // Calculate the current date
        let currentDate = new Date(startDate);
        if (viewMode === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + period);
        } else if (viewMode === 'quarterly') {
            currentDate.setMonth(currentDate.getMonth() + (period * 3));
        } else if (viewMode === 'annually') {
            currentDate.setFullYear(currentDate.getFullYear() + period);
        } else {
            currentDate.setDate(currentDate.getDate() + (period * periodIncrementDays));
        }

        // Calculate balance with contributions
        const results = calculateWithContributions(
            principal,
            rate,
            compoundingFrequency,
            contributionAmount,
            contributionFrequency,
            currentTime
        );

        const currentBalance = results.finalAmount;
        const totalContributions = results.totalContributions;
        const periodContribution = totalContributions - previousContributions;

        // Calculate period interest (balance change minus contribution added this period)
        const periodInterest = currentBalance - previousBalance - periodContribution;
        const totalInterest = results.totalInterest;

        // Format the date based on view mode
        let dateDisplay;
        if (viewMode === 'daily' || viewMode === 'weekly') {
            dateDisplay = formatDateShort(currentDate);
        } else {
            dateDisplay = formatDateLong(currentDate);
        }

        tableHTML += '<tr>';
        tableHTML += `<td>${dateDisplay}</td>`;
        if (hasContributions) {
            tableHTML += `<td>${formatCurrency(periodContribution)}</td>`;
        }
        tableHTML += `<td>${formatCurrency(currentBalance)}</td>`;
        tableHTML += `<td>${formatCurrency(periodInterest)}</td>`;
        tableHTML += `<td>${formatCurrency(totalInterest)}</td>`;
        tableHTML += '</tr>';

        previousBalance = currentBalance;
        previousContributions = totalContributions;

        // Stop if we've reached the end of the investment period
        if (currentTime >= timeInYears) break;
    }

    tableHTML += '</tbody></table>';
    breakdownTableEl.innerHTML = tableHTML;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDateLong(date) {
    // Format: "10 Oct 2025"
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function formatDateShort(date) {
    // Format: "DD/MM/YY"
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

function formatTimePeriod(totalDays) {
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 days';
}

function formatTimePeriodFromInputs(years, months, days) {
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 days';
}
