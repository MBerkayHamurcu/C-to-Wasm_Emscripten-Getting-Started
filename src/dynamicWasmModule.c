void cFunction4(double number, double *array, int arrayLen)
{
	for (int i = 0; i < arrayLen; i++) {
		array[i] *= number;
	}

	return;
}
