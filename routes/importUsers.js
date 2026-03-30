/**
 * Routes: Import Users từ Excel
 * POST /api/users/upload
 * GET /api/users/sample
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const userController = require('../controllers/users');
const {
    importUsersFromExcel,
    createSampleExcelFile
} = require('../utils/excelImportHandler');

// ======================
// 📂 Multer config
// ======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/import-excel');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.random();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('❌ Chỉ cho phép file Excel (.xlsx, .xls)'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// ======================
// 📥 GET sample file
// ======================
router.get('/sample', async (req, res) => {
    try {
        const samplePath = path.join(__dirname, '../uploads/sample-users.xlsx');

        if (!fs.existsSync(samplePath)) {
            await createSampleExcelFile(samplePath);
        }

        res.download(samplePath, 'sample-users.xlsx');
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ======================
// 📤 POST upload Excel
// ======================
router.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '❌ Vui lòng chọn file Excel'
            });
        }

        console.log('📂 Import Excel:', req.file.filename);

        const results = await importUsersFromExcel(
            req.file.path,
            userController
        );

        // Xóa file sau khi import
        fs.unlink(req.file.path, () => {});

        res.json({
            success: true,
            message: '✅ Import thành công',
            data: results
        });

    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {});

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
