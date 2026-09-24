# ============================================================
# GYMINI API Security Test Suite
# ============================================================

$API = "https://gymini-production-c2e5.up.railway.app"

# ---- Test users ----
$TEST_USER_EMAIL = "secur-test-user@example.com"
$TEST_USER_PASS  = "Test1234!"
$TEST_USER_NAME  = "Secur Testuser"

$TEST_ADMIN_EMAIL = "rbactest@example.com"
$TEST_ADMIN_PASS  = "PUT_YOUR_ADMIN_PASSWORD_HERE"

# ---- Result tracking ----
$script:pass = 0
$script:fail = 0

function Test-Result {
    param($Name, $Expected, $Actual, $Body = "")
    if ($Actual -eq $Expected) {
        Write-Host "  [PASS] $Name (HTTP $Actual)" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] $Name (expected $Expected, got $Actual)" -ForegroundColor Red
        if ($Body) { Write-Host "         body: $Body" -ForegroundColor DarkGray }
        $script:fail++
    }
}

function Section($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}


# ============================================================
# 1. HEALTH CHECK
# ============================================================
Section "1. Public health check"
$r = Invoke-WebRequest -Uri "$API/health" -SkipHttpErrorCheck
Test-Result "GET /health" 200 $r.StatusCode
Write-Host "         body: $($r.Content)" -ForegroundColor DarkGray

# ============================================================
# 2. REGISTER
# ============================================================
Section "2. Register endpoint"

$r = Invoke-WebRequest -Uri "$API/api/auth/register" -Method POST `
    -ContentType "application/json" `
    -Body (@{ fullName = $TEST_USER_NAME; email = "not-an-email"; password = $TEST_USER_PASS } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/register (invalid email)" 400 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/register" -Method POST `
    -ContentType "application/json" `
    -Body (@{ fullName = $TEST_USER_NAME; email = "weakpw@example.com"; password = "123" } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/register (weak password)" 400 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/register" -Method POST `
    -ContentType "application/json" `
    -Body (@{ fullName = $TEST_USER_NAME; email = $TEST_USER_EMAIL; password = $TEST_USER_PASS } | ConvertTo-Json) `
    -SkipHttpErrorCheck

if ($r.StatusCode -eq 201) {
    Write-Host "  [PASS] POST /auth/register (valid)" -ForegroundColor Green
    $userData = $r.Content | ConvertFrom-Json
    $userToken = $userData.token
    $userRefresh = $userData.refreshToken
    $script:pass++
} elseif ($r.StatusCode -eq 400 -and $r.Content -match "already exists") {
    Write-Host "  [INFO] User already exists - logging in instead" -ForegroundColor Yellow
    $r = Invoke-WebRequest -Uri "$API/api/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body (@{ email = $TEST_USER_EMAIL; password = $TEST_USER_PASS } | ConvertTo-Json)
    $userData = $r.Content | ConvertFrom-Json
    $userToken = $userData.token
    $userRefresh = $userData.refreshToken
    $script:pass++
} else {
    Write-Host "  [FAIL] POST /auth/register (valid) got $($r.StatusCode)" -ForegroundColor Red
    Write-Host "         body: $($r.Content)" -ForegroundColor DarkGray
    $script:fail++
    $userToken = $null
}

# ============================================================
# 3. LOGIN
# ============================================================
Section "3. Login endpoint"

$r = Invoke-WebRequest -Uri "$API/api/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $TEST_USER_EMAIL; password = "WrongPassword!" } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/login (wrong password)" 400 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = "doesnotexist@example.com"; password = "Test1234!" } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/login (nonexistent)" 400 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $TEST_ADMIN_EMAIL; password = $TEST_ADMIN_PASS } | ConvertTo-Json) `
    -SkipHttpErrorCheck

if ($r.StatusCode -eq 200) {
    Write-Host "  [PASS] POST /auth/login (admin)" -ForegroundColor Green
    $adminData = $r.Content | ConvertFrom-Json
    $adminToken = $adminData.token
    $script:pass++
} else {
    Write-Host "  [FAIL] POST /auth/login (admin) got $($r.StatusCode)" -ForegroundColor Red
    Write-Host "         Check TEST_ADMIN_PASS at top of script" -ForegroundColor Yellow
    $script:fail++
    $adminToken = $null
}



# ============================================================
# 4. /auth/me
# ============================================================
Section "4. /auth/me (requires auth)"

$r = Invoke-WebRequest -Uri "$API/api/auth/me" -SkipHttpErrorCheck
Test-Result "GET /auth/me (no token)" 401 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/me" -Headers @{ Authorization = "Bearer garbage.token.here" } -SkipHttpErrorCheck
Test-Result "GET /auth/me (malformed token)" 401 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/me" -Headers @{ Authorization = "Basic dXNlcjpwYXNz" } -SkipHttpErrorCheck
Test-Result "GET /auth/me (wrong scheme)" 401 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/me" -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
Test-Result "GET /auth/me (valid user token)" 200 $r.StatusCode

# ============================================================
# 5. USER ENDPOINTS
# ============================================================
Section "5. User endpoints (require auth)"

$r = Invoke-WebRequest -Uri "$API/api/plans" -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
Test-Result "GET /api/plans (auth)" 200 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/plans" -SkipHttpErrorCheck
Test-Result "GET /api/plans (no auth)" 401 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/workouts/today" -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
if ($r.StatusCode -in 200, 404) {
    Write-Host "  [PASS] GET /api/workouts/today (auth) - HTTP $($r.StatusCode)" -ForegroundColor Green
    $script:pass++
} else {
    Write-Host "  [FAIL] GET /api/workouts/today got $($r.StatusCode)" -ForegroundColor Red
    $script:fail++
}

# ============================================================
# 6. ADMIN RBAC
# ============================================================
Section "6. Admin RBAC"

$r = Invoke-WebRequest -Uri "$API/api/admin/users" -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
Test-Result "GET /api/admin/users as USER" 403 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/admin/stats" -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
Test-Result "GET /api/admin/stats as USER" 403 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/admin/users/000000000000000000000000" -Method DELETE `
    -Headers @{ Authorization = "Bearer $userToken" } -SkipHttpErrorCheck
Test-Result "DELETE /api/admin/users/:id as USER" 403 $r.StatusCode

if ($adminToken) {
    $r = Invoke-WebRequest -Uri "$API/api/admin/users" -Headers @{ Authorization = "Bearer $adminToken" } -SkipHttpErrorCheck
    Test-Result "GET /api/admin/users as ADMIN" 200 $r.StatusCode

    $r = Invoke-WebRequest -Uri "$API/api/admin/stats" -Headers @{ Authorization = "Bearer $adminToken" } -SkipHttpErrorCheck
    Test-Result "GET /api/admin/stats as ADMIN" 200 $r.StatusCode

    $adminMe = (Invoke-WebRequest -Uri "$API/api/auth/me" -Headers @{ Authorization = "Bearer $adminToken" }).Content | ConvertFrom-Json
    $r = Invoke-WebRequest -Uri "$API/api/admin/users/$($adminMe._id)/role" -Method PUT `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -ContentType "application/json" `
        -Body (@{ role = "user" } | ConvertTo-Json) `
        -SkipHttpErrorCheck
    Test-Result "PUT /admin/users/:self/role (blocked)" 400 $r.StatusCode
}


# ============================================================
# 7. REFRESH TOKEN FLOW
# ============================================================
Section "7. Refresh token flow"

$r = Invoke-WebRequest -Uri "$API/api/auth/refresh" -Method POST `
    -ContentType "application/json" `
    -Body (@{ refreshToken = $userRefresh } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/refresh (valid)" 200 $r.StatusCode

if ($r.StatusCode -eq 200) {
    $newTokens = $r.Content | ConvertFrom-Json
    $newUserRefresh = $newTokens.refreshToken
}

$r = Invoke-WebRequest -Uri "$API/api/auth/refresh" -Method POST `
    -ContentType "application/json" `
    -Body (@{ refreshToken = $userRefresh } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/refresh (reuse old)" 401 $r.StatusCode

$r = Invoke-WebRequest -Uri "$API/api/auth/refresh" -Method POST `
    -ContentType "application/json" `
    -Body (@{ refreshToken = "bogus-token" } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/refresh (bogus)" 401 $r.StatusCode

# ============================================================
# 8. LOGOUT
# ============================================================
Section "8. Logout"

$r = Invoke-WebRequest -Uri "$API/api/auth/logout" -Method POST `
    -ContentType "application/json" `
    -Body (@{ refreshToken = $newUserRefresh } | ConvertTo-Json) `
    -SkipHttpErrorCheck
Test-Result "POST /auth/logout" 200 $r.StatusCode

# ============================================================
# 9. CORS
# ============================================================
Section "9. CORS enforcement"

try {
    $headers = @{ Origin = "https://evil-attacker.example" }
    $r = Invoke-WebRequest -Uri "$API/health" -Headers $headers -SkipHttpErrorCheck
    $acao = $r.Headers["Access-Control-Allow-Origin"]
    if (-not $acao -or $acao -eq "null") {
        Write-Host "  [PASS] CORS blocks unknown origin" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] CORS leaked ACAO: $acao" -ForegroundColor Red
        $script:fail++
    }
} catch {
    Write-Host "  [PASS] CORS blocked request" -ForegroundColor Green
    $script:pass++
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  SECURITY TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Passed: $script:pass" -ForegroundColor Green
Write-Host "  Failed: $script:fail" -ForegroundColor $(if ($script:fail -gt 0) { "Red" } else { "Green" })
Write-Host "============================================================" -ForegroundColor Cyan

if ($script:fail -eq 0) {
    Write-Host "`nAll security tests passed." -ForegroundColor Green
} else {
    Write-Host "`n$script:fail test(s) failed. Review above." -ForegroundColor Red
}