import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

type UserRole = 'client' | 'cashier' | 'head-cashier' | 'admin' | 'creator' | 'nikitovsky' | null;

interface Item {
  id: string;
  name: string;
  category: 'documents' | 'photos' | 'maps' | 'other';
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  depositDate: string;
  pickupDate?: string;
  depositAmount: number;
  pickupAmount: number;
  status: 'stored' | 'issued';
  qrCode: string;
}

const ROLE_PASSWORDS: Record<Exclude<UserRole, 'client' | null>, string> = {
  'cashier': '25',
  'head-cashier': '202520',
  'admin': '2025',
  'creator': '202505',
  'nikitovsky': '20252025'
};

const ROLE_COLORS: Record<Exclude<UserRole, null>, string> = {
  'client': 'bg-blue-500',
  'cashier': 'bg-green-500',
  'head-cashier': 'bg-emerald-600',
  'admin': 'bg-purple-500',
  'creator': 'bg-orange-500',
  'nikitovsky': 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
};

const ROLE_NAMES: Record<Exclude<UserRole, null>, string> = {
  'client': 'Клиент',
  'cashier': 'Кассир',
  'head-cashier': 'Главный кассир',
  'admin': 'Администратор',
  'creator': 'Создатель',
  'nikitovsky': 'Никитовский'
};

export default function Index() {
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [password, setPassword] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [archive, setArchive] = useState<Item[]>([]);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'documents' as Item['category'],
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    depositDate: new Date().toISOString().split('T')[0],
    pickupDate: '',
    depositAmount: 0,
    pickupAmount: 0
  });

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        if (Date.now() > lockoutUntil) {
          setLockoutUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleLogin = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({
        title: '🔒 Вход заблокирован',
        description: `Попробуйте через ${remainingSeconds} секунд`,
        variant: 'destructive'
      });
      return;
    }

    if (selectedRole === 'client') {
      if (clientPhone) {
        setCurrentRole('client');
        toast({ title: '✅ Добро пожаловать!', description: 'Вход выполнен' });
      } else {
        toast({ title: '❌ Ошибка', description: 'Введите номер телефона', variant: 'destructive' });
      }
      return;
    }

    if (selectedRole && selectedRole !== 'client') {
      const correctPassword = ROLE_PASSWORDS[selectedRole];
      if (password === correctPassword) {
        setCurrentRole(selectedRole);
        setFailedAttempts(0);
        setPassword('');
        toast({ title: '✅ Доступ разрешён', description: `Вы вошли как ${ROLE_NAMES[selectedRole]}` });
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 90000);
          toast({
            title: '🔒 Слишком много попыток',
            description: 'Вход заблокирован на 90 секунд',
            variant: 'destructive'
          });
        } else {
          toast({
            title: '❌ Неверный пароль',
            description: `Попыток осталось: ${3 - newAttempts}`,
            variant: 'destructive'
          });
        }
        setPassword('');
      }
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setSelectedRole(null);
    setPassword('');
    setClientPhone('');
  };

  const generateQRCode = () => {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.clientName || !newItem.clientPhone) {
      toast({ title: '❌ Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const item: Item = {
      id: Date.now().toString(),
      ...newItem,
      status: 'stored',
      qrCode: generateQRCode()
    };

    setItems([...items, item]);
    toast({ title: '✅ Товар принят', description: `QR-код: ${item.qrCode}` });
    
    setNewItem({
      name: '',
      category: 'documents',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      depositDate: new Date().toISOString().split('T')[0],
      pickupDate: '',
      depositAmount: 0,
      pickupAmount: 0
    });
  };

  const handleIssueItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const issuedItem = { ...item, status: 'issued' as const };
      setArchive([...archive, issuedItem]);
      setItems(items.filter(i => i.id !== itemId));
      toast({ title: '✅ Товар выдан', description: `Товар "${item.name}" перемещён в архив` });
    }
  };

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 animate-scale-in shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Icon name="QrCode" size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              QR Документы
            </h1>
            <p className="text-muted-foreground mt-2">Система управления хранением</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-center mb-4">Выберите тип входа</h2>
              {(['client', 'cashier', 'head-cashier', 'admin', 'creator', 'nikitovsky'] as const).map((role) => (
                <Button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full h-14 text-lg font-semibold ${ROLE_COLORS[role]} hover:opacity-90 transition-all hover:scale-105`}
                >
                  {ROLE_NAMES[role]}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <Badge className={`${ROLE_COLORS[selectedRole]} text-white px-4 py-2`}>
                  {ROLE_NAMES[selectedRole]}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRole(null)}>
                  <Icon name="ArrowLeft" size={20} />
                </Button>
              </div>

              {selectedRole === 'client' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Номер телефона</Label>
                    <Input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Пароль</Label>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="text-lg"
                      disabled={lockoutUntil !== null && Date.now() < lockoutUntil}
                    />
                  </div>
                  {lockoutUntil && Date.now() < lockoutUntil && (
                    <p className="text-sm text-destructive text-center">
                      ⏳ Блокировка: {Math.ceil((lockoutUntil - Date.now()) / 1000)} сек
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleLogin}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={lockoutUntil !== null && Date.now() < lockoutUntil}
              >
                Войти
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const clientItems = currentRole === 'client' ? items.filter(i => i.clientPhone === clientPhone) : items;
  const clientArchive = currentRole === 'client' ? archive.filter(i => i.clientPhone === clientPhone) : archive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Icon name="QrCode" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">QR Документы</h1>
              <Badge className={`${ROLE_COLORS[currentRole]} text-white mt-1`}>
                {ROLE_NAMES[currentRole]}
              </Badge>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="items" className="gap-2">
              <Icon name="Package" size={18} />
              Товары
            </TabsTrigger>
            {currentRole !== 'client' && currentRole !== 'cashier' && (
              <TabsTrigger value="new" className="gap-2">
                <Icon name="Plus" size={18} />
                Приём
              </TabsTrigger>
            )}
            <TabsTrigger value="archive" className="gap-2">
              <Icon name="Archive" size={18} />
              Архив
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 animate-fade-in">
            {clientItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Нет товаров на хранении</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clientItems.map((item) => (
                  <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow animate-slide-up">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-purple-100 text-purple-700">{item.category}</Badge>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-primary">{item.qrCode}</div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={14} />
                        {item.clientName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={14} />
                        {item.clientPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={14} />
                        {item.depositDate}
                      </div>
                    </div>

                    <div className="flex gap-2 text-sm mb-4">
                      <div className="flex-1 bg-green-50 rounded p-2">
                        <div className="text-green-700 font-semibold">{item.depositAmount}₽</div>
                        <div className="text-xs text-green-600">Внесено</div>
                      </div>
                      <div className="flex-1 bg-orange-50 rounded p-2">
                        <div className="text-orange-700 font-semibold">{item.pickupAmount}₽</div>
                        <div className="text-xs text-orange-600">При выдаче</div>
                      </div>
                    </div>

                    {currentRole !== 'client' && (
                      <Button
                        onClick={() => handleIssueItem(item.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Icon name="CheckCircle" size={18} className="mr-2" />
                        Выдать
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {currentRole !== 'client' && currentRole !== 'cashier' && (
            <TabsContent value="new" className="animate-fade-in">
              <Card className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Icon name="Plus" size={24} />
                  Приём нового товара
                </h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Название товара *</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Например: Паспорт"
                      />
                    </div>
                    <div>
                      <Label>Категория *</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Item['category'] })}
                      >
                        <option value="documents">Документы</option>
                        <option value="photos">Фото</option>
                        <option value="maps">Карты</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>ФИО клиента *</Label>
                      <Input
                        value={newItem.clientName}
                        onChange={(e) => setNewItem({ ...newItem, clientName: e.target.value })}
                        placeholder="Иванов Иван Иванович"
                      />
                    </div>
                    <div>
                      <Label>Телефон *</Label>
                      <Input
                        type="tel"
                        value={newItem.clientPhone}
                        onChange={(e) => setNewItem({ ...newItem, clientPhone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email (необязательно)</Label>
                    <Input
                      type="email"
                      value={newItem.clientEmail}
                      onChange={(e) => setNewItem({ ...newItem, clientEmail: e.target.value })}
                      placeholder="example@mail.ru"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Дата приёма *</Label>
                      <Input
                        type="date"
                        value={newItem.depositDate}
                        onChange={(e) => setNewItem({ ...newItem, depositDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Дата выдачи (план)</Label>
                      <Input
                        type="date"
                        value={newItem.pickupDate}
                        onChange={(e) => setNewItem({ ...newItem, pickupDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Сумма при приёме (₽)</Label>
                      <Input
                        type="number"
                        value={newItem.depositAmount}
                        onChange={(e) => setNewItem({ ...newItem, depositAmount: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Сумма при выдаче (₽)</Label>
                      <Input
                        type="number"
                        value={newItem.pickupAmount}
                        onChange={(e) => setNewItem({ ...newItem, pickupAmount: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateItem}
                    className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Icon name="Plus" size={20} className="mr-2" />
                    Принять товар и создать QR
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="archive" className="space-y-4 animate-fade-in">
            {clientArchive.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="Archive" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Архив пуст</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clientArchive.map((item) => (
                  <Card key={item.id} className="p-6 opacity-75 hover:opacity-100 transition-opacity">
                    <Badge className="bg-gray-100 text-gray-700 mb-4">Выдано</Badge>
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={14} />
                        {item.clientName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="QrCode" size={14} />
                        {item.qrCode}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
