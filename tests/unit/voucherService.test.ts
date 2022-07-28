import voucherService from '../../src/services/voucherService.js';
import { faker } from '@faker-js/faker';
import { jest } from '@jest/globals';
import voucherRepository from '../../src/repositories/voucherRepository.js';
import { conflictError } from '../../src/utils/errorUtils.js';

describe('voucherService test suite', () => {
    it('should create a voucher', async () => {
        const voucherData = {
            id: 1,
            code: faker.random.alphaNumeric(),
            discount: __generateValue(1, 100),
            used: false,
        };
        jest.spyOn(
            voucherRepository,
            'getVoucherByCode'
        ).mockImplementationOnce(() => {
            return undefined;
        });

        jest.spyOn(voucherRepository, 'createVoucher').mockResolvedValueOnce(
            voucherData
        );
        await voucherService.createVoucher(
            voucherData.code,
            voucherData.discount
        );
        expect(voucherRepository.createVoucher).toBeCalledTimes(1);
    });

    it('should fail to create a voucher that already exist', async () => {
        const voucherData = {
            id: 1,
            code: faker.random.alphaNumeric(),
            discount: __generateValue(1, 100),
            used: false,
        };
        jest.spyOn(
            voucherRepository,
            'getVoucherByCode'
        ).mockImplementationOnce((): any => {
            return voucherData;
        });

        expect(
            voucherService.createVoucher(voucherData.code, voucherData.discount)
        ).rejects.toEqual(conflictError('Voucher already exist.'));
    });

    it('should apply a voucher', async () => {
        const voucherData = {
            id: 1,
            code: faker.random.alphaNumeric(),
            discount: __generateValue(1, 100),
            used: false,
        };
        const amount = __generateValue(100, 200);
        jest.spyOn(
            voucherRepository,
            'getVoucherByCode'
        ).mockImplementationOnce((): any => {
            return voucherData;
        });

        jest.spyOn(voucherRepository, 'useVoucher').mockImplementationOnce(
            (): any => {
                return voucherData.code;
            }
        );

        let finalAmount = amount;
        if (isAmountValidForDiscount(amount) && !voucherData.used) {
            finalAmount = applyDiscount(amount, voucherData.discount);
        }

        const result = await voucherService.applyVoucher(
            voucherData.code,
            amount
        );
        expect(result.amount).toBe(amount);
        expect(result.discount).toBe(voucherData.discount);
        expect(result.finalAmount).toBe(finalAmount);
        expect(result.applied).toBe(finalAmount !== amount);
    });

    it('should not apply a voucher that dont exist', async () => {
        const voucherData = {
            id: 1,
            code: faker.random.alphaNumeric(),
            discount: __generateValue(1, 100),
            used: false,
        };
        const amount = __generateValue(100, 200);
        jest.spyOn(
            voucherRepository,
            'getVoucherByCode'
        ).mockImplementationOnce((): any => {
            return undefined;
        });

        expect(
            voucherService.applyVoucher(voucherData.code, amount)
        ).rejects.toEqual(conflictError('Voucher does not exist.'));
    });
});

function __generateValue(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function isAmountValidForDiscount(amount: number) {
    return amount >= 100;
}

function applyDiscount(value: number, discount: number) {
    return value - value * (discount / 100);
}
