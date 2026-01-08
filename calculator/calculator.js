// DOM Elements
const principalInput = document.getElementById('principal');
const interestRateInput = document.getElementById('interest-rate');
const rateTypeSelect = document.getElementById('rate-type');
const compoundingFrequencySelect = document.getElementById('compounding-frequency');
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
const totalInterestEl = document.getElementById('total-interest');
const calculationPeriodEl = document.getElementById('calculation-period');
const breakdownTableEl = document.getElementById('breakdown-table');
const growthChartCanvas = document.getElementById('growth-chart');

// Chart instance
let growthChart = null;

// Store calculation data for regenerating breakdown
let calculationData = null;

// Event Listeners
calculateBtn.addEventListener('click', calculate);

// Update breakdown when view selection changes
breakdownViewSelect.addEventListener('change', () => {
    if (calculationData) {
        generateBreakdown(
            calculationData.principal,
            calculationData.rate,
            calculationData.compoundingFrequency,
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

            // Validation
            if (principal <= 0) {
                alert('Please enter a valid principal amount');
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

            // Calculate compound interest
            // Formula: A = P(1 + r/n)^(nt)
            // Where r is annual rate, n is compounding frequency, t is time in years
            // We've already calculated the period rate (r/n) as periodRatePercent
            const periodRate = periodRatePercent / 100; // Convert percentage to decimal
            const numberOfPeriods = compoundingFrequency * timeInYears;
            const finalAmount = principal * Math.pow((1 + periodRate), numberOfPeriods);
            const totalInterest = finalAmount - principal;

            // Display results
            displayResults(principal, finalAmount, totalInterest, periodText, periodRate, compoundingFrequency, timeInYears, startDate, endDate);

        } catch (error) {
            alert('An error occurred during calculation. Please check your inputs.');
            console.error(error);
        } finally {
            calculateBtn.classList.remove('loading');
            calculateBtn.disabled = false;
        }
    }, 300); // Small delay for better UX
}

function displayResults(principal, finalAmount, totalInterest, periodText, rate, compoundingFrequency, timeInYears, startDate, endDate) {
    // Store calculation data
    calculationData = { principal, rate, compoundingFrequency, timeInYears, startDate, endDate };

    // Format currency
    finalAmountEl.textContent = formatCurrency(finalAmount);
    totalInterestEl.textContent = formatCurrency(totalInterest);

    // Display end date
    calculationPeriodEl.textContent = formatDateLong(endDate);

    // Set up breakdown view options based on compounding frequency and time period
    setupBreakdownViewOptions(compoundingFrequency, timeInYears);

    // Generate chart
    generateChart(principal, rate, compoundingFrequency, timeInYears);

    // Generate breakdown table
    generateBreakdown(principal, rate, compoundingFrequency, timeInYears, startDate);

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

function generateChart(principal, rate, compoundingFrequency, timeInYears) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // Destroy existing chart if it exists
    if (growthChart) {
        growthChart.destroy();
    }

    // Limit data points for clean visualization (max 12 points)
    let dataPoints = Math.min(Math.ceil(timeInYears * 4), 12);
    if (dataPoints < 4) dataPoints = Math.min(Math.ceil(timeInYears * 12), 12);
    let timeIncrement = timeInYears / dataPoints;

    const labels = [];
    const balanceData = [];

    // Generate data points
    for (let i = 0; i <= dataPoints; i++) {
        const currentTime = i * timeIncrement;
        const numberOfPeriods = compoundingFrequency * currentTime;
        const currentBalance = principal * Math.pow((1 + rate), numberOfPeriods);

        // Create clean, minimal labels
        let label;
        if (timeInYears <= 0.25) {
            // Show in days for very short periods
            const days = Math.round(currentTime * 365);
            label = days === 0 ? 'Start' : `${days}d`;
        } else if (timeInYears <= 1) {
            // Show in months for short periods
            const months = Math.round(currentTime * 12);
            label = months === 0 ? 'Start' : `${months}mo`;
        } else {
            // Show in years for longer periods
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
        balanceData.push(currentBalance);
    }

    // Get theme-aware colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#666666' : '#999999';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
    const tooltipText = isDark ? '#f0f0f0' : '#1a1a1a';
    const accentColor = '#c17f24';

    // Create gradient for area fill
    const ctx = growthChartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, isDark ? 'rgba(193, 127, 36, 0.25)' : 'rgba(193, 127, 36, 0.15)');
    gradient.addColorStop(1, isDark ? 'rgba(193, 127, 36, 0)' : 'rgba(193, 127, 36, 0)');

    // Create chart with refined, minimal aesthetic
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Balance',
                    data: balanceData,
                    borderColor: accentColor,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: accentColor,
                    pointHoverBorderColor: isDark ? '#1a1a1a' : '#ffffff',
                    pointHoverBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.6,
            layout: {
                padding: {
                    top: 8,
                    right: 8,
                    bottom: 0,
                    left: 0
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: accentColor,
                    titleFont: {
                        family: "'IBM Plex Mono', monospace",
                        size: 10,
                        weight: '500'
                    },
                    bodyColor: tooltipText,
                    bodyFont: {
                        family: "'IBM Plex Mono', monospace",
                        size: 12,
                        weight: '600'
                    },
                    borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grace: '10%',
                    ticks: {
                        maxTicksLimit: 5,
                        callback: function(value) {
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                            return '$' + value.toLocaleString();
                        },
                        color: textColor,
                        font: {
                            family: "'IBM Plex Mono', monospace",
                            size: 9
                        },
                        padding: 8
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
                        color: textColor,
                        font: {
                            family: "'IBM Plex Mono', monospace",
                            size: 9
                        },
                        padding: 4
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
            }
        }
    });
}

function generateBreakdown(principal, rate, compoundingFrequency, timeInYears, startDate) {
    const viewMode = breakdownViewSelect.value;
    let periodLabel;
    let periodsToShow;
    let periodIncrement; // in years
    let periodIncrementDays; // in days for date calculation

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
    tableHTML += '<th>Balance</th>';
    tableHTML += '<th>Interest Earned</th>';
    tableHTML += '<th>Total Interest</th>';
    tableHTML += '</tr></thead><tbody>';

    let previousBalance = principal;

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

        // Calculate balance using compound interest formula
        // A = P(1 + r)^n where r is period rate, n is number of periods
        const numberOfPeriods = compoundingFrequency * currentTime;
        const currentBalance = principal * Math.pow((1 + rate), numberOfPeriods);

        const periodInterest = currentBalance - previousBalance;
        const totalInterest = currentBalance - principal;

        // Format the date based on view mode
        let dateDisplay;
        if (viewMode === 'daily' || viewMode === 'weekly') {
            dateDisplay = formatDateShort(currentDate);
        } else {
            dateDisplay = formatDateLong(currentDate);
        }

        tableHTML += '<tr>';
        tableHTML += `<td>${dateDisplay}</td>`;
        tableHTML += `<td>${formatCurrency(currentBalance)}</td>`;
        tableHTML += `<td>${formatCurrency(periodInterest)}</td>`;
        tableHTML += `<td>${formatCurrency(totalInterest)}</td>`;
        tableHTML += '</tr>';

        previousBalance = currentBalance;

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
