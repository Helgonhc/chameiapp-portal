/**
 * Utilitário para compressão de imagens
 * Reduz o tamanho das imagens mantendo qualidade visual
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 2,
}

/**
 * Comprime uma imagem mantendo a qualidade visual
 * @param file - Arquivo de imagem original
 * @param options - Opções de compressão
 * @returns Promise com o arquivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calcular novas dimensões mantendo aspect ratio
        let { width, height } = img
        const aspectRatio = width / height

        if (width > opts.maxWidth!) {
          width = opts.maxWidth!
          height = width / aspectRatio
        }

        if (height > opts.maxHeight!) {
          height = opts.maxHeight!
          width = height * aspectRatio
        }

        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'))
          return
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob com qualidade especificada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'))
              return
            }

            // Verificar se o tamanho está dentro do limite
            const sizeMB = blob.size / 1024 / 1024
            if (sizeMB > opts.maxSizeMB!) {
              // Se ainda está grande, reduzir qualidade
              const newQuality = Math.max(0.5, opts.quality! * (opts.maxSizeMB! / sizeMB))
              canvas.toBlob(
                (newBlob) => {
                  if (!newBlob) {
                    reject(new Error('Erro ao comprimir imagem'))
                    return
                  }

                  const compressedFile = new File([newBlob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  })

                  resolve(compressedFile)
                },
                file.type,
                newQuality
              )
            } else {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })

              resolve(compressedFile)
            }
          },
          file.type,
          opts.quality
        )
      }

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Comprime múltiplas imagens em paralelo
 * @param files - Array de arquivos de imagem
 * @param options - Opções de compressão
 * @returns Promise com array de arquivos comprimidos
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map((file) => compressImage(file, options))
  return Promise.all(compressionPromises)
}

/**
 * Formata o tamanho do arquivo para exibição
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Calcula a porcentagem de redução de tamanho
 * @param originalSize - Tamanho original em bytes
 * @param compressedSize - Tamanho comprimido em bytes
 * @returns Porcentagem de redução
 */
export function calculateReduction(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

/**
 * Valida se o arquivo é uma imagem
 * @param file - Arquivo a ser validado
 * @returns true se for imagem, false caso contrário
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Valida o tamanho do arquivo
 * @param file - Arquivo a ser validado
 * @param maxSizeMB - Tamanho máximo em MB
 * @returns true se estiver dentro do limite, false caso contrário
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const sizeMB = file.size / 1024 / 1024
  return sizeMB <= maxSizeMB
}
